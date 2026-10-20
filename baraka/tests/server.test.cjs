const {test}=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../server.cjs');
function request(url,method='GET'){return new Promise(resolve=>{const response={code:0,headers:{},writeHead(code,headers){this.code=code;this.headers=headers},end(body){resolve({...this,body})}};handler({url,method},response)})}
test('entry page and local assets serve successfully without external dependencies',async()=>{for(const url of ['/','/index.html','/style.css','/app.js','/favicon.svg','/model.js','/sync.js','/sw.js','/manifest.webmanifest','/places.js','/day.js','/welcome.html','/welcome.css','/welcome.js']){const result=await request(url);assert.equal(result.code,200,url);assert.ok(result.body.length>0,url);assert.equal(result.headers['Cache-Control'],'no-cache')}});
test('HEAD omits body and invalid paths do not expose local files',async()=>{assert.equal((await request('/app.js','HEAD')).body,undefined);assert.equal((await request('/server.cjs')).code,404);assert.equal((await request('/../README.md')).code,404);assert.equal((await request('/__proto__')).code,404);assert.equal((await request('/data/database.json')).code,404);assert.equal((await request('/data/push-key.json')).code,404);assert.equal((await request('/.env')).code,404);assert.equal((await request('/','POST')).code,405)});

// Verify the real cookie/session boundary without opening a network port.
test('landing layers are local and unknown asset paths remain private',async()=>{
 const home=await request('/');assert.match(home.body.toString(),/id="auth-form"/);assert.doesNotMatch(home.body.toString(),/id="view"/);
 for(const cut of ['d','m'])for(const layer of ['sky','earth','moonscape','frame','astronaut','ground']){
  const result=await request(`/layers/${cut}/${layer}.webp`);assert.equal(result.code,200);assert.equal(result.headers['Content-Type'],'image/webp');assert.ok(result.body.length>100);
 }
 for(const photo of ['exterior','interior']){const image=await request(`/media/home/${photo}.webp`);assert.equal(image.code,200);assert.equal(image.headers['Content-Type'],'image/webp');assert.ok(image.body.length>1000)}
 assert.equal((await request('/layers/d/unknown.webp')).code,404);
 assert.equal((await request('/layers/d/../../../server.cjs')).code,404);
});
test('dashboard requires a valid session, opens after registration/login, and closes after logout',async t=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {createApplication}=require('../server.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baraka-entry-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const app=createApplication({dataDirectory:dir,origin:'http://localhost:3000',push:{ready:false,publicKey:'test'},utilityAdapter:null});
 function dashboard(cookie='',method='GET'){return new Promise((resolve,reject)=>{const response={writeHead(code,headers){this.code=code;this.headers=headers},end(body){resolve({code:this.code,headers:this.headers,body})}};Promise.resolve(app.handle({url:'/app.html',method,headers:{cookie},socket:{remoteAddress:'entry-test'}},response)).catch(reject)})}
 let result=await dashboard();assert.equal(result.code,302);assert.equal(result.headers.Location,'/');
 const req={method:'POST',url:'/api/auth/register',headers:{origin:'http://localhost:3000','content-type':'application/json'},socket:{remoteAddress:'entry-test'}};
 const credentials={name:'Dilnoza',email:'entry@example.com',password:'Strong-passphrase-2026!'};
 const registration=await app.api.dispatch(req,'/api/auth/register',credentials);
 let cookie=registration.headers['Set-Cookie'].split(';')[0];
 result=await dashboard(cookie);assert.equal(result.code,200);assert.match(result.body.toString(),/id="view"/);assert.match(result.body.toString(),/auth-pending/);
 result=await dashboard(cookie,'HEAD');assert.equal(result.code,200);assert.equal(result.body,undefined);
 await app.api.dispatch({...req,headers:{...req.headers,cookie}},'/api/auth/logout',{});
 assert.equal((await dashboard(cookie)).code,302);
 await assert.rejects(()=>app.api.dispatch(req,'/api/auth/login',{email:credentials.email,password:'wrong-password'}),e=>e.status===401);
 const login=await app.api.dispatch(req,'/api/auth/login',credentials);cookie=login.headers['Set-Cookie'].split(';')[0];
 assert.equal((await dashboard(cookie)).code,200);
 app.store.update(db=>{db.sessions=[]});assert.equal((await dashboard(cookie)).code,302);
});
