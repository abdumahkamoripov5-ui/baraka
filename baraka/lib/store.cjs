'use strict';
const fs=require('node:fs');
const path=require('node:path');
class Store{
 constructor(directory){this.directory=directory;this.file=path.join(directory,'database.json');fs.mkdirSync(directory,{recursive:true,mode:0o700});if(fs.existsSync(this.file)){this.data=JSON.parse(fs.readFileSync(this.file,'utf8'));if(this.data.version!==1||!Array.isArray(this.data.users))throw Error('Ma’lumotlar bazasi formati noto‘g‘ri.')}else this.data={version:1,users:[],households:[],sessions:[],invites:[],subscriptions:[],payments:[],events:[],notificationLog:[]};this.data.voiceJobs=this.data.voiceJobs||[];this.lock=null}
 // One process owns the database. Every mutation is persisted before it becomes visible.
 update(fn){const draft=JSON.parse(JSON.stringify(this.data));const result=fn(draft);const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(draft),{mode:0o600});const fd=fs.openSync(temp,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}fs.renameSync(temp,this.file);this.data=draft;return result}
 acquire(){const lockfile=path.join(this.directory,'server.lock');try{this.lock=fs.openSync(lockfile,'wx',0o600);fs.writeSync(this.lock,String(process.pid));this.lockfile=lockfile}catch(err){if(err.code==='EEXIST'){const pid=Number(fs.readFileSync(lockfile,'utf8'));try{process.kill(pid,0)}catch(e){if(e.code==='ESRCH'){fs.unlinkSync(lockfile);return this.acquire()}}throw Error('Bu ma’lumotlar papkasini boshqa Baraka jarayoni ishlatyapti.')}throw err}}
 release(){if(this.lock!==null){fs.closeSync(this.lock);try{fs.unlinkSync(this.lockfile)}catch{}this.lock=null}}
}
module.exports={Store};
