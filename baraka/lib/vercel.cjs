'use strict';
const {handler}=require('../server.cjs');
const {createAPI}=require('./api.cjs');
const {getDatabase}=require('./postgres.cjs');

function originFromEnvironment(env){
 const origin=env.APP_ORIGIN;
 if(!origin)throw Error('APP_ORIGIN sozlanmagan.');
 const parsed=new URL(origin);
 if(parsed.protocol!=='https:'||parsed.origin!==origin)throw Error('APP_ORIGIN HTTPS manzil bo‘lsin, oxirida / bo‘lmasin.');
 return origin;
}
async function readBody(req){
 if(['GET','HEAD'].includes(req.method))return {};
 // Vercel can populate body before invoking a Node function. Local tests and
 // raw requests use the stream instead. Apply the same size limit to both.
 let raw;
 if(req.body!==undefined&&req.body!==null){raw=Buffer.isBuffer(req.body)?req.body.toString('utf8'):typeof req.body==='string'?req.body:JSON.stringify(req.body)}
 else {const chunks=[];let size=0;for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>4*1024*1024)throw Object.assign(Error('So‘rov juda katta.'),{status:413});chunks.push(b)}raw=Buffer.concat(chunks).toString('utf8')}
 if(Buffer.byteLength(raw)>4*1024*1024)throw Object.assign(Error('So‘rov juda katta.'),{status:413});
 try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(Error('JSON noto‘g‘ri.'),{status:400})}
}
function send(res,result){res.writeHead(result.status||200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...result.headers});res.end(JSON.stringify(result.body))}
const unavailable={status:503,body:{error:'Server sozlamasi yoki baza ulanishi tayyor emas. Keyinroq qayta urinib ko‘ring.'}};
function createVercelHandler({database,env=process.env}={}){
 return async function vercelHandler(req,res){
  let pathname;
  try{pathname=new URL(req.url,'https://baraka.invalid').pathname}catch{send(res,{status:400,body:{error:'Manzil noto‘g‘ri.'}});return}
  if(!pathname.startsWith('/api/')&&pathname!=='/app.html')return handler(req,res);
  // These integrations require persistent keys, in-memory OTP challenges or a
  // continuously running scheduler. Never silently enable them on serverless.
  if(/^\/api\/(push\/|voice\/|utilities\/(payments|webhook)|access\/(code|verify|recover|reset))/.test(pathname)||pathname==='/api/telegram'&&req.method!=='GET'){
   send(res,{status:503,body:{error:'Bu xizmat Vercel versiyasida hali ulanmagan.'}});return;
  }
  try{
   const origin=originFromEnvironment(env),body=await readBody(req);
   const result=await (database||getDatabase()).transaction(async store=>{
    const limits=new Map((store.data.vercelLimits||[]).filter(([,value])=>value.until>Date.now()));
    const api=createAPI({store,origin,push:{ready:false,publicKey:''},voice:null,utilityAdapter:null,accessAdapter:null,limits});
    // Trust only Vercel's overwritten client-IP header, never user-supplied XFF.
    const request={method:req.method,url:req.url,headers:req.headers,socket:{remoteAddress:env.VERCEL==='1'?String(req.headers['x-vercel-forwarded-for']||'unknown').split(',')[0].trim():(req.socket?.remoteAddress||'local')}};
    let response;
    try{
     if(pathname==='/app.html'){
      if(!['GET','HEAD'].includes(req.method))return {status:405,headers:{Allow:'GET, HEAD'},body:{error:'Usul qo‘llanmaydi.'}};
      try{await api.dispatch({...request,method:'GET'},'/api/auth/me',{});response={dashboard:true}}
      catch(error){if(error.status!==401)throw error;response={redirect:true}}
     }else if(pathname==='/api/telegram'&&req.method==='GET')response={body:{configured:false,botName:'',enabled:false,chatId:''}};
     else response=await api.dispatch(request,pathname,body);
     if(pathname==='/api/status'&&response.body)Object.assign(response.body,{hosting:'vercel',syncPollMs:60000,reminders:{automatic:false}});
    }catch(error){response={status:error.status||500,body:{error:error.status?error.message:'Server xatosi. Qayta urinib ko‘ring.'}}}
    // Persist abuse counters even on rejected login attempts and cold starts.
    store.update(db=>{db.vercelLimits=[...limits]});
    return response;
   });
   if(result.dashboard)return handler(req,res);
   if(result.redirect){res.writeHead(302,{Location:'/', 'Cache-Control':'no-store'});res.end();return}
   send(res,result);
  }catch(error){send(res,error.status?{status:error.status,body:{error:error.message}}:unavailable)}
 };
}
module.exports={createVercelHandler,readBody,originFromEnvironment};
