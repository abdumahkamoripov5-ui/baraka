'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createCityServices}=require('./city-services.cjs');
const {createVoice}=require('./voice.cjs');
// Read-only readiness checks. Never send a push, SMS, payment or voice call.
function configuration(env=process.env){
 const origin=env.APP_ORIGIN||'http://localhost:'+String(env.PORT||3000);
 const adapterReady=name=>!!env[name]&&fs.existsSync(path.resolve(env[name]));
 let voice=false,voiceError='';try{voice=createVoice({env,origin}).ready}catch(e){voiceError=e.message}
 return[
  {service:'Internetdagi server',configured:/^https:\/\//.test(origin),needs:['APP_ORIGIN (HTTPS hosting manzili)']},
  {service:'Jonli avtobus GPS',configured:adapterReady('BARAKA_TRANSIT_ADAPTER'),needs:['Transport operatorining ruxsatli API manbasi','BARAKA_TRANSIT_ADAPTER']},
  {service:'Kommunal operator',configured:adapterReady('BARAKA_UTILITY_ADAPTER')&&!!env.BARAKA_PAYMENT_ALLOWED_HOSTS,needs:['Operator shartnomasi va API','BARAKA_UTILITY_ADAPTER','BARAKA_PAYMENT_ALLOWED_HOSTS']},
  {service:'Telefon push eslatmasi',configured:/^(mailto:|https:\/\/)/.test(env.PUSH_CONTACT||''),needs:['PUSH_CONTACT','Brauzer ruxsati va HTTPS (yoki localhost)']},
  {service:'SMS / email adapteri',configured:adapterReady('BARAKA_ACCESS_ADAPTER'),needs:['BARAKA_ACCESS_ADAPTER','SMS va/yoki email operator shartnomasi']},
  {service:'Telegram eslatmalari',configured:!!env.TELEGRAM_BOT_TOKEN&&/^[A-Za-z0-9_]{5,32}$/.test(env.TELEGRAM_BOT_NAME||''),needs:['TELEGRAM_BOT_TOKEN','TELEGRAM_BOT_NAME','Foydalanuvchining botdagi Start tasdig‘i']},
  {service:'Telefon qo‘ng‘irog‘i',configured:voice,needs:['VOICE_TWILIO_ACCOUNT_SID','VOICE_TWILIO_AUTH_TOKEN','VOICE_FROM_NUMBER','VOICE_RECIPIENTS_JSON','APP_ORIGIN (HTTPS)'],...(voiceError?{error:voiceError}:{})}
 ];
}
async function probeServices({city='tashkent',send=globalThis.fetch,now=()=>Date.now()}={}){
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now()));
 const service=createCityServices({now,send:(url,options)=>send(url,{...options,signal:AbortSignal.timeout(5000)})});
 const tasks=[['Namoz vaqtlari / AlAdhan',()=>service.prayers(city,date,3)],['Bekatlar / OpenStreetMap',()=>service.transit(city)]];
 return Promise.all(tasks.map(async([name,run])=>{try{const result=await run();return{service:name,reachable:true,source:result.source,...(result.stops?{stops:result.stops.length,liveGPS:false}:{date:result.date})}}catch(e){return{service:name,reachable:false,error:e.message,status:e.status||502}}}));
}
module.exports={configuration,probeServices};
