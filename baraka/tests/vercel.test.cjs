'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const {Pool}=require('pg');
const {emptyDatabase,SnapshotStore,createDatabase}=require('../lib/postgres.cjs');
const {createVercelHandler,readBody,originFromEnvironment}=require('../lib/vercel.cjs');
const origin='https://baraka.example.com';
function request(handle,url,{method='GET',body,cookie='',headers={}}={}){
 return new Promise((resolve,reject)=>{
  const req=Readable.from([]);Object.assign(req,{url,method,body,headers:{origin,'content-type':'application/json',cookie,...headers},socket:{remoteAddress:'test'}});
  const res={writeHead(status,headers){this.status=status;this.headers=headers},end(body){let json;try{json=JSON.parse(body)}catch{}resolve({status:this.status,headers:this.headers,body,json})}};
  Promise.resolve(handle(req,res)).catch(reject);
 });
}
test('Vercel validates canonical HTTPS origin and handles parsed/raw request bodies',async()=>{
 assert.equal(originFromEnvironment({APP_ORIGIN:origin}),origin);
 for(const value of [undefined,'http://remote.test',origin+'/',origin+'/app'])assert.throws(()=>originFromEnvironment({APP_ORIGIN:value}));
 assert.deepEqual(await readBody({method:'POST',body:{name:'Ali'}}),{name:'Ali'});
 const raw=Readable.from([Buffer.from('{"name":"Ali"}')]);raw.method='POST';assert.deepEqual(await readBody(raw),{name:'Ali'});
 await assert.rejects(()=>readBody({method:'POST',body:'{broken'}),{status:400});
 await assert.rejects(()=>readBody({method:'POST',body:'x'.repeat(4*1024*1024+1)}),{status:413});
});
test('snapshot mutations are isolated and failures do not alter the current snapshot',()=>{
 const initial=emptyDatabase(),store=new SnapshotStore(initial);
 assert.throws(()=>store.update(db=>{db.events.push('bad');throw Error('stop')}));
 assert.deepEqual(store.data.events,[]);assert.equal(store.dirty,false);
 store.update(db=>db.events.push('saved'));assert.deepEqual(initial.events,[]);assert.deepEqual(store.data.events,['saved']);
 assert.throws(()=>new SnapshotStore({version:99,users:[]}));
});
test('database failures roll back and never return an uncommitted login cookie',async()=>{
 const calls=[];const client={async query(sql){calls.push(sql);if(sql==='SELECT payload FROM baraka_snapshot WHERE id = 1')return{rows:[]};if(sql==='COMMIT')throw Error('database unavailable');return{rows:[]}},release(){calls.push('release')}};
 const handle=createVercelHandler({env:{APP_ORIGIN:origin},database:createDatabase({connect:async()=>client})});
 const response=await request(handle,'/api/auth/register',{method:'POST',body:{name:'Ali',email:'commit@example.com',password:'secret'}});
 assert.equal(response.status,503);assert.equal(response.headers['Set-Cookie'],undefined);assert.ok(calls.includes('ROLLBACK'));assert.equal(calls.at(-1),'release');
});
test('static assets require no database and private server files are not served',async()=>{
 const handle=createVercelHandler({env:{}});
 assert.equal((await request(handle,'/')).status,200);
 assert.equal((await request(handle,'/style.css')).status,200);
 for(const url of ['/server.cjs','/.env','/data/database.json','/lib/postgres.cjs'])assert.equal((await request(handle,url)).status,404);
 assert.equal((await request(handle,'/api/status')).status,503);
 assert.equal((await request(handle,'/app.html')).status,503);
 assert.equal((await request(handle,'/api/push/subscribe',{method:'POST',body:{}})).status,503);
});
test('PostgreSQL integration: cold starts, auth, concurrency, revisions and durable rate limits',{skip:!process.env.TEST_DATABASE_URL},async t=>{
 // Only use a dedicated disposable database. This test owns baraka_snapshot.
 const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:4});
 t.after(async()=>{await pool.query('DROP TABLE IF EXISTS baraka_snapshot');await pool.end()});
 await pool.query('DROP TABLE IF EXISTS baraka_snapshot');
 const database=createDatabase(pool),fresh=()=>createVercelHandler({env:{APP_ORIGIN:origin},database});
 let response=await request(fresh(),'/api/status');assert.equal(response.status,200);assert.equal(response.json.hosting,'vercel');assert.equal(response.json.push.ready,false);assert.equal(response.json.syncPollMs,60000);
 assert.equal((await request(fresh(),'/app.html')).status,302);
 response=await request(fresh(),'/api/auth/register',{method:'POST',body:{name:'Ali',email:'ali@example.com',password:'secret'}});
 assert.equal(response.status,201);assert.match(response.headers['Set-Cookie'],/HttpOnly.*SameSite=Strict.*Secure/);
 const cookie=response.headers['Set-Cookie'].split(';')[0],initial=response.json;
 assert.equal((await request(fresh(),'/api/auth/me',{cookie})).json.user.email,'ali@example.com');
 assert.equal((await request(fresh(),'/app.html',{cookie})).status,200);
 // Independent handlers model separate Vercel instances racing on one revision.
 const edits=await Promise.all(['Ali oilasi','Yangi oila'].map(name=>request(fresh(),'/api/state',{method:'PUT',cookie,body:{householdId:initial.household.id,revision:0,state:{...initial.state,settings:{...initial.state.settings,name}}}})));
 assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);
 assert.equal((await request(fresh(),'/api/state',{cookie})).json.revision,1);
 await Promise.all(Array.from({length:5},(_,i)=>database.transaction(async store=>{await new Promise(resolve=>setTimeout(resolve,10));store.update(db=>db.events.push('concurrent-'+i))})));
 assert.equal((await pool.query('SELECT payload FROM baraka_snapshot WHERE id=1')).rows[0].payload.events.length,5);
 // CSRF and server-side validation are still enforced in the new adapter.
 assert.equal((await request(fresh(),'/api/auth/logout',{method:'POST',cookie,body:{},headers:{origin:'https://attacker.example'}})).status,403);
 assert.equal((await request(fresh(),'/api/auth/login',{method:'POST',body:'{'})).status,400);
 for(let i=0;i<8;i++)await request(fresh(),'/api/auth/login',{method:'POST',body:{email:'ali@example.com',password:'wrong'}});
 assert.equal((await request(fresh(),'/api/auth/login',{method:'POST',body:{email:'ali@example.com',password:'wrong'}})).status,429);
 await request(fresh(),'/api/auth/logout',{method:'POST',cookie,body:{}});
 assert.equal((await request(fresh(),'/app.html',{cookie})).status,302);
 // A whole transaction that fails must not save its earlier mutations.
 await assert.rejects(()=>database.transaction(async store=>{store.update(db=>db.events.push('rollback'));throw Error('abort')}));
 assert.ok(!(await pool.query('SELECT payload FROM baraka_snapshot WHERE id=1')).rows[0].payload.events.includes('rollback'));
});
