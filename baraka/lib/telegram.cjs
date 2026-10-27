'use strict';
const crypto=require('node:crypto');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
function createTelegram({store,token=process.env.TELEGRAM_BOT_TOKEN,botName=process.env.TELEGRAM_BOT_NAME,fetcher=fetch,now=()=>Date.now()}){
 const configured=!!token&&/^[A-Za-z0-9_]{5,32}$/.test(botName||'');
 async function call(method,body){const r=await fetcher(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const result=await r.json();if(!r.ok||!result.ok)fail(502,'Telegram xizmati javob bermadi.');return result.result}
 async function dispatch(user,method,body){
 if(method==='GET')return{body:{configured,botName:configured?botName:'',enabled:!!user.telegram?.enabled,chatId:user.telegram?.chatId||''}};
 if(!configured)fail(503,'Telegram boti hali sozlanmagan.');
 if(body.enabled===false){store.update(db=>{delete db.users.find(u=>u.id===user.id).telegram});return{body:{ok:true}}}
 if(body.action==='pair'){const code=crypto.randomBytes(24).toString('base64url');store.update(db=>{db.users.find(u=>u.id===user.id).telegramPair={hash:digest(code),expires:now()+600000}});return {body:{url:`https://t.me/${botName}?start=${code}`}}}
 if(body.action==='verify'){
 const pair=user.telegramPair;if(!pair||pair.expires<now())fail(400,'Ulash muddati tugagan. Qayta boshlang.');const updates=await call('getUpdates',{limit:100,timeout:0,allowed_updates:['message']});const match=updates.find(u=>u.message?.chat?.type==='private'&&typeof u.message.text==='string'&&u.message.text.startsWith('/start ')&&digest(u.message.text.slice(7).trim())===pair.hash);if(!match)fail(400,'Avval havoladagi botda Start tugmasini bosing.');store.update(db=>{const u=db.users.find(u=>u.id===user.id);if(u.telegramPair?.hash!==pair.hash)fail(409,'Ulash holati o‘zgargan.');u.telegram={chatId:String(match.message.chat.id),enabled:true};delete u.telegramPair});return{body:{ok:true}};
 }
 fail(400,'Ulash amalini tanlang.');
 }
 let busy=false;
 async function tick(){if(!configured||busy)return;busy=true;try{const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now()));for(const user of store.data.users){if(!user.telegram?.enabled||user.telegram.lastDay===today)continue;const h=store.data.households.find(h=>h.id===user.currentHouseholdId);if(!h||!user.householdIds.includes(h.id)||h.roles?.[user.id]==='child')continue;const s=h.state;const due=[...(s.tasks||[]),...(s.appointments||[]),...(s.bills||[]),...(s.debts||[]).filter(x=>!x.paid) ].some(x=>!x.done&&x.date<=today);if(!due)continue;
 // Mark before sending: an uncertain response must not trigger duplicate reminders.
 store.update(db=>{const u=db.users.find(u=>u.id===user.id);if(u.telegram)u.telegram.lastDay=today});try{await call('sendMessage',{chat_id:user.telegram.chatId,text:'Baraka: yaqinlashayotgan reja va to‘lovlaringizni tekshiring.'})}catch{/* Retry on the next day; no financial content or token is logged. */}
 }}finally{busy=false}}
 return {dispatch,tick};
}
module.exports={createTelegram};
