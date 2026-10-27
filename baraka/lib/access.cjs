'use strict';
const crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
// Adapters are administrator-owned modules; credentials never enter the browser.
function loadAccess(){
 if(!process.env.BARAKA_ACCESS_ADAPTER)return null;
 return require(require('node:path').resolve(process.env.BARAKA_ACCESS_ADAPTER));
}
function createAccess({store,adapter,now=()=>Date.now(),hashPassword,newSession,snapshot,cookie,empty,limit}){
 const pending=new Map();
 async function dispatch(req,path,body,key){
 if(path==='/api/access/status'&&req.method==='GET')return {body:{sms:typeof adapter?.sendCode==='function',recovery:typeof adapter?.sendRecovery==='function'}};
 if(path==='/api/access/code'&&req.method==='POST'){
 limit('sms:'+key,3);if(!adapter?.sendCode)fail(503,'SMS operatori hali ulanmagan.');
 const phone=String(body.phone||'').replace(/[\s()-]/g,'');if(!/^\+[1-9]\d{7,14}$/.test(phone))fail(400,'Telefonni xalqaro formatda kiriting.');limit('phone:'+phone,3);
 const challenge=crypto.randomBytes(32).toString('base64url'),code=String(crypto.randomInt(100000,1000000));
 for(const [k,p] of pending)if(p.expires<now())pending.delete(k);
 if(pending.size>5000)fail(429,'Server band.');pending.set(challenge,{hash:hash(code),phone,expires:now()+300000,attempts:0});
 try{await adapter.sendCode({phone,code,expiresIn:300})}catch{pending.delete(challenge);fail(502,'SMS yuborilmadi. Keyinroq urinib ko‘ring.')}
 return {body:{challenge,expiresIn:300}};
 }
 if(path==='/api/access/verify'&&req.method==='POST'){
 limit('verify:'+key,8);const p=pending.get(body.challenge);if(!p||p.expires<now()||++p.attempts>5){pending.delete(body.challenge);fail(400,'Kod eskirgan yoki urinishlar tugagan.');}if(typeof body.code!=='string'||hash(body.code)!==p.hash)fail(400,'Kod noto‘g‘ri.');pending.delete(body.challenge);
 let user=store.data.users.find(u=>u.phone===p.phone),house,session;
 if(!user){const name=String(body.name||'').trim();if(!name||name.length>40)fail(400,'Yangi hisob uchun ismingizni kiriting.');const salt=crypto.randomBytes(16).toString('hex'),passwordHash=(await hashPassword(crypto.randomBytes(32).toString('hex'),salt)).toString('hex');store.update(db=>{if(db.users.some(u=>u.phone===p.phone))fail(409,'Qayta kirib ko‘ring.');const hid=crypto.randomUUID();user={id:crypto.randomUUID(),name,phone:p.phone,email:p.phone.slice(1)+'@phone.baraka.invalid',salt,hash:passwordHash,currentHouseholdId:hid,householdIds:[hid],createdAt:now()};house={id:hid,ownerId:user.id,state:empty(name+' oilasi',name),revision:0};db.users.push(user);db.households.push(house);session=newSession(db,user)})}
 else {house=store.data.households.find(h=>h.id===user.currentHouseholdId);store.update(db=>{session=newSession(db,user)})}
 return {headers:{'Set-Cookie':cookie(session)},body:snapshot(user,house)};
 }
 if(path==='/api/access/recover'&&req.method==='POST'){
 limit('recover:'+key,3);if(!adapter?.sendRecovery)fail(503,'Email orqali tiklash xizmati ulanmagan.');const email=String(body.email||'').trim().toLowerCase();limit('recover-email:'+email,3);const user=store.data.users.find(u=>u.email===email);
 if(user){const token=crypto.randomBytes(32).toString('base64url');store.update(db=>{const u=db.users.find(u=>u.id===user.id);u.recoveryHash=hash(token);u.recoveryExpires=now()+1800000});try{await adapter.sendRecovery({email,token,expiresIn:1800})}catch{fail(502,'Tiklash xizmati vaqtincha ishlamayapti.')}}
 return {body:{ok:true,message:'Hisob mavjud bo‘lsa, emailga tiklash kodi yuboriladi.'}};
 }
 if(path==='/api/access/reset'&&req.method==='POST'){
 limit('reset:'+key,5);if(typeof body.token!=='string'||body.token.length>100||typeof body.password!=='string'||!body.password.trim()||body.password.length>128)fail(400,'Kod va yangi parolni tekshiring.');const user=store.data.users.find(u=>u.recoveryHash===hash(body.token)&&u.recoveryExpires>now());if(!user)fail(400,'Tiklash kodi noto‘g‘ri yoki eskirgan.');const salt=crypto.randomBytes(16).toString('hex'),result=(await hashPassword(body.password,salt)).toString('hex');store.update(db=>{const u=db.users.find(u=>u.id===user.id);if(u.recoveryHash!==hash(body.token)||u.recoveryExpires<=now())fail(400,'Kod ishlatilgan.');u.salt=salt;u.hash=result;delete u.recoveryHash;delete u.recoveryExpires;db.sessions=db.sessions.filter(s=>s.userId!==u.id);db.subscriptions=db.subscriptions.filter(s=>s.userId!==u.id)});return {body:{ok:true}};
 }
 return null;
 }
 return {dispatch};
}
module.exports={createAccess,loadAccess};
