'use strict';
// RFC 8292 VAPID + RFC 8030 empty push. No private financial payload is sent.
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const allowedHost=h=>['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-par02p.notify.windows.com'].includes(h)||h.endsWith('.push.services.mozilla.com')||h.endsWith('.notify.windows.com');
function validateEndpoint(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!allowedHost(u.hostname))throw Error('Push manzili qo‘llab-quvvatlanmaydi.');return u}
function createPush(directory,subject,send=globalThis.fetch){
 const file=path.join(directory,'push-key.json');let privateKey;
 if(fs.existsSync(file))privateKey=crypto.createPrivateKey({key:JSON.parse(fs.readFileSync(file,'utf8')),format:'jwk'});
 else{privateKey=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey;fs.writeFileSync(file,JSON.stringify(privateKey.export({format:'jwk'})),{mode:0o600})}
 const jwk=crypto.createPublicKey(privateKey).export({format:'jwk'}),publicKey=Buffer.concat([Buffer.from([4]),Buffer.from(jwk.x,'base64url'),Buffer.from(jwk.y,'base64url')]).toString('base64url');
 const ready=typeof subject==='string'&&/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject);
 async function notify(subscription){if(!ready)throw Error('Push aloqa manzili sozlanmagan.');const target=validateEndpoint(subscription.endpoint),now=Math.floor(Date.now()/1000),header=Buffer.from(JSON.stringify({typ:'JWT',alg:'ES256'})).toString('base64url'),claims=Buffer.from(JSON.stringify({aud:target.origin,exp:now+3600,sub:subject})).toString('base64url'),input=header+'.'+claims,signature=crypto.sign('sha256',Buffer.from(input),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');const result=await send(target,{method:'POST',headers:{Authorization:`vapid t=${input}.${signature}, k=${publicKey}`,TTL:'3600',Urgency:'normal','Content-Length':'0'},redirect:'error',signal:AbortSignal.timeout(10000)});if(result.status!==201&&result.status!==202){const error=Error('Push xizmati xabarni qabul qilmadi.');error.status=result.status;throw error}return true}
 return{publicKey,ready,notify};
}
function dueItems(state,today){const end=new Date(today+'T12:00:00');end.setDate(end.getDate()+3);const until=`${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;return [...(state.tasks||[]).filter(t=>!t.done&&t.date<=until).map(t=>({id:t.id,date:t.date,type:'task'})),...(state.appointments||[]).filter(t=>!t.done&&t.date<=until).map(t=>({id:t.id,date:t.date,type:'appointment'})),...state.bills.filter(b=>!b.done&&b.date<=until).map(b=>({id:b.id,date:b.date,type:'bill'})),...state.debts.filter(d=>d.amount-(d.repaid||0)>0&&d.date<=until).map(d=>({id:d.id,date:d.date,type:'debt'}))]}
function tashkentDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function createScheduler(store,push){let busy=false;return async function tick(today=tashkentDay()){
 if(busy||!push.ready)return;busy=true;
 try{for(const sub of [...store.data.subscriptions]){const user=store.data.users.find(u=>u.id===sub.userId),house=user&&store.data.households.find(h=>h.id===user.currentHouseholdId);if(!user||!house||!user.householdIds.includes(house.id)||!store.data.sessions.some(s=>s.hash===sub.sessionHash&&s.expires>Date.now()))continue;const due=dueItems(house.state,today);if(!due.length)continue;const key=sub.id+':'+today+':'+house.id;if(store.data.notificationLog.some(l=>l.key===key))continue;
 try{await push.notify(sub);store.update(db=>{db.notificationLog=db.notificationLog.filter(l=>Date.now()-l.at<30*86400000);db.notificationLog.push({key,at:Date.now()})})}catch(error){if([404,410].includes(error.status))store.update(db=>{db.subscriptions=db.subscriptions.filter(s=>s.id!==sub.id)})}
 }}finally{busy=false}
}}
module.exports={createPush,createScheduler,dueItems,validateEndpoint};
