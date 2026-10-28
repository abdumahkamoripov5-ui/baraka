const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {createPush,createScheduler,validateEndpoint}=require('../lib/push.cjs');
const {Store}=require('../lib/store.cjs');
const {empty}=require('../dist/model.js');
function directory(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baraka-push-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir}
test('VAPID uses a persistent P-256 key and a verifiable short-lived ES256 signature',async t=>{let request;const dir=directory(t),push=createPush(dir,'mailto:ops@example.com',async(url,options)=>{request={url,options};return{status:201}});await push.notify({endpoint:'https://fcm.googleapis.com/fcm/send/test'});const match=request.options.headers.Authorization.match(/^vapid t=(.*), k=(.*)$/);assert.ok(match);const [header,payload,signature]=match[1].split('.');assert.equal(JSON.parse(Buffer.from(header,'base64url')).alg,'ES256');const claims=JSON.parse(Buffer.from(payload,'base64url'));assert.equal(claims.aud,'https://fcm.googleapis.com');assert.ok(claims.exp> Date.now()/1000&&claims.exp<Date.now()/1000+86400);const bytes=Buffer.from(match[2],'base64url'),key=crypto.createPublicKey({key:{kty:'EC',crv:'P-256',x:bytes.subarray(1,33).toString('base64url'),y:bytes.subarray(33).toString('base64url')},format:'jwk'});assert.ok(crypto.verify('sha256',Buffer.from(header+'.'+payload),{key,dsaEncoding:'ieee-p1363'},Buffer.from(signature,'base64url')));assert.equal(createPush(dir,'mailto:ops@example.com').publicKey,push.publicKey);assert.equal(request.options.body,undefined);assert.equal(request.options.redirect,'error')});
test('push delivery distinguishes accepted and rejected service responses',async t=>{const push=createPush(directory(t),'mailto:ops@example.com',async()=>({status:410}));await assert.rejects(push.notify({endpoint:'https://fcm.googleapis.com/fcm/send/test'}),e=>e.status===410);assert.throws(()=>validateEndpoint('https://127.0.0.1/'));assert.throws(()=>validateEndpoint('https://fcm.googleapis.com@attacker.test/'))});
test('scheduler sends once per day and stops after session expiry',async t=>{let calls=0;const store=new Store(directory(t)),state=empty();state.bills=[{id:'b',name:'Internet',date:'2026-10-19',amount:100,frequency:'monthly'}];store.update(db=>{db.users=[{id:'u',currentHouseholdId:'h',householdIds:['h']}];db.households=[{id:'h',state,revision:0}];db.sessions=[{hash:'session',userId:'u',expires:Date.now()+60000}];db.subscriptions=[{id:'s',userId:'u',sessionHash:'session',endpoint:'https://fcm.googleapis.com/test'}]});const tick=createScheduler(store,{ready:true,notify:async()=>{calls++}});await tick('2026-10-19');await tick('2026-10-19');assert.equal(calls,1);store.update(db=>{db.sessions=[]});await tick('2026-10-20');assert.equal(calls,1)});

function worker({windows=[],fetch:fetcher=async()=>({ok:true,redirected:false,clone(){return this}})}={}){
 const vm=require('node:vm'),listeners={},entries=new Map(),opened=[],notifications=[];
 const cache={put:async(key,value)=>entries.set(key,value),match:async key=>entries.get(key)};
 const self={location:{origin:'https://baraka.test'},addEventListener(type,fn){(listeners[type]??=[]).push(fn)},registration:{showNotification:async(...args)=>notifications.push(args)},clients:{matchAll:async()=>windows,openWindow:async url=>opened.push(url),claim:async()=>{}},skipWaiting(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/sw.js'),'utf8'),{self,URL,fetch:fetcher,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true}});
 return{entries,opened,notifications,async dispatch(type,event={}){const jobs=[];event.waitUntil=p=>jobs.push(p);event.respondWith=p=>jobs.push(p);for(const fn of listeners[type]||[])fn(event);return Promise.all(jobs)}};
}
test('push notification and clicks target the application calendar and reuse an app tab',async()=>{
 const navigated=[];let focused=0,closed=0;
 const landing={url:'https://baraka.test/',navigate:async()=>{throw Error('wrong tab')}};
 const app={url:'https://baraka.test/app.html#today',navigate:async url=>{navigated.push(url);return{focus:async()=>focused++}}};
 const w=worker({windows:[landing,app]});await w.dispatch('push');
 assert.equal(w.notifications[0][1].data.url,'/app.html#calendar');
 await w.dispatch('notificationclick',{notification:{close(){closed++}}});
 assert.deepEqual(navigated,['/app.html#calendar']);assert.equal(focused,1);assert.equal(closed,1);assert.equal(w.opened.length,0);
});
test('notification clicks open the calendar when no usable app window exists',async()=>{
 for(const windows of [[],[{url:'https://other.test/app.html'}],[{url:'https://baraka.test/',navigate:async()=>null}]]){
  const w=worker({windows});await w.dispatch('notificationclick',{notification:{close(){}}});assert.deepEqual(w.opened,['/app.html#calendar']);
 }
});
test('offline shell reuses online assets fetched with query strings and excludes API responses',async()=>{
 let offline=false,calls=0;const response={ok:true,redirected:false,clone(){return this}};
 const w=worker({fetch:async()=>{calls++;if(offline)throw Error('offline');return response}});
 const event=url=>({request:{method:'GET',url:'https://baraka.test'+url}});
 await w.dispatch('fetch',event('/app.js?v=6'));offline=true;
 assert.equal((await w.dispatch('fetch',event('/app.js?v=7')))[0],response);
 assert.equal(w.entries.size,1);assert.equal(w.entries.get('/app.js'),response);
 await w.dispatch('fetch',event('/api/state'));assert.equal(calls,2);
});
