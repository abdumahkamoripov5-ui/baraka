'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {Store}=require('./lib/store.cjs');
const {createAPI}=require('./lib/api.cjs');
const {createPush,createScheduler}=require('./lib/push.cjs');
const {createVoice,createVoiceScheduler}=require('./lib/voice.cjs');
const {createCityServices}=require('./lib/city-services.cjs');
const {loadUtilityAdapter}=require('./lib/utilities.cjs');
const directory=path.join(__dirname,'dist');
const files=['index.html','style.css','app.js','model.js','sync.js','sw.js','manifest.webmanifest','favicon.svg','day.js','places.js','welcome.html','welcome.css','welcome.js'];
const assets=Object.fromEntries(files.map(f=>['/'+f,f]));assets['/']='welcome.html';assets['/index.html']='welcome.html';assets['/app.html']='index.html';
for(const name of ['exterior','interior']){const file=`media/home/${name}.webp`;assets['/'+file]=file}
// Only these twelve known layer files are public; never expose arbitrary paths.
for(const cut of ['d','m'])for(const layer of ['sky','earth','moonscape','frame','astronaut','ground']){const file=`layers/${cut}/${layer}.webp`;assets['/'+file]=file}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.webp':'image/webp'};
function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return}
 let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{res.writeHead(400);res.end();return}
 const asset=Object.hasOwn(assets,pathname)?assets[pathname]:null;
 if(!asset){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Sahifa topilmadi');return}
 fs.readFile(path.join(directory,asset),(error,data)=>{if(error){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Sayt faylini o‘qib bo‘lmadi.');return}res.writeHead(200,{'Content-Type':types[path.extname(asset)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(self)','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; worker-src 'self'"});res.end(req.method==='HEAD'?undefined:data)});
}
function createApplication({dataDirectory=process.env.BARAKA_DATA_DIR||path.join(__dirname,'data'),origin=process.env.APP_ORIGIN||'http://localhost:3000',push,utilityAdapter,lock=false}={}){
 const target=new URL(origin);if(!['http:','https:'].includes(target.protocol)||target.origin!==origin)throw Error('APP_ORIGIN faqat sayt manzilidan iborat bo‘lsin, oxirida / bo‘lmasin.');
 if(target.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(target.hostname))throw Error('Internetdagi hisob uchun APP_ORIGIN HTTPS bo‘lishi kerak.');
 const store=new Store(dataDirectory);if(lock)store.acquire();
 try{push=push||createPush(dataDirectory,process.env.PUSH_CONTACT);utilityAdapter=utilityAdapter===undefined?loadUtilityAdapter():utilityAdapter;const voice=createVoice({origin});let transitAdapter=null;if(process.env.BARAKA_TRANSIT_ADAPTER){transitAdapter=require(path.resolve(process.env.BARAKA_TRANSIT_ADAPTER));if(typeof transitAdapter.snapshot!=='function')throw Error('Transport adapteri snapshot metodini taqdim etishi kerak.')}const cityServices=createCityServices({transitAdapter});const api=createAPI({store,origin,push,utilityAdapter,voice,cityServices,paymentHosts:(process.env.BARAKA_PAYMENT_ALLOWED_HOSTS||'').split(',').filter(Boolean)}),pushTick=createScheduler(store,push),voiceTick=createVoiceScheduler(store,voice),tick=async()=>{await Promise.allSettled([pushTick(),voiceTick()])};return{store,push,api,tick,voice,handle:async(req,res)=>{if(req.url.startsWith('/api/'))return api.handle(req,res);let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{return handler(req,res)}if(pathname==='/app.html'&&['GET','HEAD'].includes(req.method)){try{await api.dispatch({method:'GET',headers:req.headers,socket:req.socket,url:req.url},'/api/auth/me',{})}catch(error){if(error.status===401){res.writeHead(302,{'Location':'/','Cache-Control':'no-store'});res.end();return}res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Hisob holatini tekshirib bo‘lmadi. Qayta urinib ko‘ring.');return}}return handler(req,res)}}}catch(error){store.release();throw error}
}
if(require.main===module){
 const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
 if(!Number.isInteger(port)||port<1||port>65535){console.error('PORT 1–65535 oralig‘ida bo‘lishi kerak.');process.exitCode=1}
 else{let app;try{app=createApplication({origin:process.env.APP_ORIGIN||`http://localhost:${port}`,lock:true})}catch(error){console.error(error.message);process.exitCode=1}
 if(app){const server=http.createServer(app.handle);server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=50;server.keepAliveTimeout=5000;const interval=setInterval(()=>app.tick().catch(()=>{}),15000);interval.unref();server.on('error',error=>{app.store.release();clearInterval(interval);console.error(`Server ishga tushmadi: ${error.code||'UNKNOWN'} · ${host}:${port}`);console.error(error.message);if(error.code==='EADDRINUSE')console.error(`Port ${port} band. Eski serverni Ctrl+C bilan to‘xtating yoki boshqa PORT tanlang.`);else if(['EACCES','EPERM'].includes(error.code))console.error('Tizim bu portni ochishni blokladi. Boshqa portni tanlab qayta urinib ko‘ring.');process.exitCode=1});server.listen(port,host,()=>{console.log(`Baraka tayyor: ${process.env.APP_ORIGIN||`http://localhost:${port}`}\nHisob va oila: serverda saqlanadi.\nTelefon eslatmalari: ${app.push.ready?'sozlangan':'PUSH_CONTACT kerak'}.\nKommunal API: ${process.env.BARAKA_UTILITY_ADAPTER?'adapter ulangan':'operator hali ulanmagan'}.\nTo‘xtatish: Ctrl+C`);app.tick().catch(()=>{})});const stop=()=>{clearInterval(interval);server.close(()=>{app.store.release();process.exit(0)})};process.once('SIGINT',stop);process.once('SIGTERM',stop);process.once('exit',()=>app.store.release())}}
}
module.exports={handler,createApplication};
