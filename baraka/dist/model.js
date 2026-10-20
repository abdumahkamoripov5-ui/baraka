(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BarakaData=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const uid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const identifier=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)?v:uid();
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const cats=Object.fromEntries(['Oziq-ovqat','Transport','Xaridlar','Uy va kommunal','Salomatlik','Ta’lim','Ko‘ngilochar','Boshqa'].map(c=>[c,true]));
function normalize(s){
 if(!s || typeof s!=='object' || !Array.isArray(s.transactions) || !Array.isArray(s.goals) || !Array.isArray(s.debts) || !Array.isArray(s.members))throw Error('Fayl Baraka zaxira nusxasi emas.');
 const num=(v,zero=true)=>{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0||v>1e12||(!zero&&v===0))throw Error('Fayldagi summa noto‘g‘ri.');return v};
 const text=(v,max=100)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Fayldagi matn noto‘g‘ri.');return v.trim()};
 const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00'))||dateKey(new Date(v+'T12:00:00'))!==v)throw Error('Fayldagi sana noto‘g‘ri.');return v};
 const category=v=>Object.hasOwn(cats,v)?v:'Boshqa';
 if(s.members.length>50||s.transactions.length>50000||s.goals.length>500||s.debts.length>5000||(s.bills||[]).length>1000)throw Error('Fayldagi yozuvlar juda ko‘p.');
 const members=[...new Set(s.members.map(m=>text(m,40)))];if(!members.length)members.push('Men');
 const cfg=s.settings||{};
 const out={version:4,demo:s.demo===true,budget:num(s.budget??0),members,settings:{name:typeof cfg.name==='string'?cfg.name.slice(0,40):'Bizning oila',theme:cfg.theme==='dark'?'dark':'light',privacy:cfg.privacy===true,motion:cfg.motion!==false},limits:{},transactions:s.transactions.map(t=>({id:identifier(t.id),name:text(t.name,80),amount:num(t.amount,false),type:t.type==='income'?'income':'expense',category:category(t.category),member:text(t.member,40),date:date(t.date),method:t.method==='Naqd'?'Naqd':'Karta',walletId:t.walletId|| (t.method==='Naqd'?'cash':'card')})),goals:s.goals.map(g=>({id:identifier(g.id),name:text(g.name,60),target:num(g.target,false),saved:num(g.saved),icon:['🎯','📱','🏝️','💍','🏡','🚗','🎓','🛟'].includes(g.icon)?g.icon:'🎯',date:g.date?date(g.date):''})),debts:s.debts.map(d=>{let amount=num(d.amount,false),repaid=d.paid?amount:num(d.repaid??0);if(repaid>amount)throw Error('Qaytarilgan summa qarzdan katta.');return{id:identifier(d.id),name:text(d.name,60),amount,repaid,date:date(d.date),type:d.type==='lent'?'lent':'borrowed',paid:repaid===amount}}),bills:(s.bills||[]).map(b=>({id:identifier(b.id),name:text(b.name,60),amount:num(b.amount,false),date:date(b.date),category:category(b.category),frequency:b.frequency==='once'?'once':'monthly',anchorDay:Number.isInteger(b.anchorDay)&&b.anchorDay>=1&&b.anchorDay<=31?b.anchorDay:Number(b.date.slice(-2)),lastPaid:b.lastPaid?date(b.lastPaid):'',done:b.done===true}))};
 for(const [k,v] of Object.entries(s.limits||{}))if(Object.hasOwn(cats,k))out.limits[k]=num(v);

 out.wallets=(s.wallets||[{id:'cash',name:'Naqd pul',type:'cash',opening:0},{id:'card',name:'Bank kartasi',type:'card',opening:0}]).map(w=>{if(typeof w.opening!=='number'||!Number.isSafeInteger(w.opening)||Math.abs(w.opening)>1e12)throw Error('Hamyon qoldig‘i noto‘g‘ri.');return{id:identifier(w.id),name:text(w.name,50),type:w.type==='cash'?'cash':'card',opening:w.opening}});
 if(!out.wallets.length||out.wallets.length>30)throw Error('1–30 ta hamyon bo‘lishi kerak.');
 const ids=new Set(out.wallets.map(w=>w.id));if(ids.size!==out.wallets.length)throw Error('Hamyonlar takrorlangan.');
 out.transactions.forEach(t=>{if(!ids.has(t.walletId))t.walletId=out.wallets[0].id});
 out.transfers=(s.transfers||[]).map(t=>{if(!ids.has(t.fromId)||!ids.has(t.toId)||t.fromId===t.toId)throw Error('O‘tkazma hamyonlari noto‘g‘ri.');return{id:identifier(t.id),fromId:t.fromId,toId:t.toId,amount:num(t.amount,false),date:date(t.date),note:typeof t.note==='string'?t.note.slice(0,100):''}});
 out.utilities=(s.utilities||[]).map(u=>({id:identifier(u.id),name:text(u.name,60),service:['electricity','gas','water','heating','waste'].includes(u.service)?u.service:'electricity',accountNumber:text(u.accountNumber,40),region:text(u.region,80)}));
 if(out.transfers.length>50000||out.utilities.length>100)throw Error('Yozuvlar soni juda ko‘p.');
 const list=(key,max)=>{const a=s[key]||[];if(!Array.isArray(a)||a.length>max)throw Error('Kundalik yozuvlar soni yoki formati noto‘g‘ri.');return a};
 const time=v=>{if(!v)return '';if(typeof v!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw Error('Vaqt noto‘g‘ri.');return v};
 const minutes=v=>{v=v??0;if(![0,5,15,30,60].includes(v))throw Error('Eslatma oralig‘i noto‘g‘ri.');return v};
 out.tasks=list('tasks',5000).map(t=>({id:identifier(t.id),name:text(t.name,100),date:date(t.date),time:time(t.time),member:text(t.member||members[0],40),priority:['low','normal','high'].includes(t.priority)?t.priority:'normal',done:t.done===true,remindMinutes:minutes(t.remindMinutes)}));
 out.appointments=list('appointments',3000).map(e=>({id:identifier(e.id),name:text(e.name,100),date:date(e.date),time:time(e.time),location:typeof e.location==='string'?e.location.slice(0,150):'',kind:e.kind==='reminder'?'reminder':'meeting',done:e.done===true,remindMinutes:minutes(e.remindMinutes)}));
 for(const list of [out.transactions,out.goals,out.debts,out.bills,out.transfers,out.utilities,out.tasks,out.appointments]){if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('Takroriy yozuv identifikatori.');}
 return out;
}
function empty(name='Bizning oila',member='Men'){return normalize({budget:0,members:[member],settings:{name},transactions:[],goals:[],debts:[],bills:[],limits:{}})}
return {normalize,empty};
});
