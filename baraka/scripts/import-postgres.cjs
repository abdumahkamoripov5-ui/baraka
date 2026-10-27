'use strict';
// Run manually against an EMPTY destination. Never modifies the source file.
const fs=require('node:fs');
const {Pool}=require('pg');
const {createDatabase}=require('../lib/postgres.cjs');
async function main(){
 if(!process.env.DATABASE_URL||!process.argv[2])throw Error('DATABASE_URL va database.json fayli manzilini kiriting.');
 const source=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 if(source.version!==1||!['users','households','sessions','invites','subscriptions','payments','events','notificationLog'].every(key=>Array.isArray(source[key])))throw Error('Baza formati noto‘g‘ri.');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
 try{await createDatabase(pool).transaction(async store=>{
  if(store.data.users.length||store.data.households.length)throw Error('Manzil bazasi bo‘sh emas. Import bekor qilindi.');
  // Require fresh logins and pairing on the new origin.
  store.update(db=>{Object.assign(db,source);db.sessions=[];db.invites=[];db.subscriptions=[];db.voiceJobs=[];db.vercelLimits=[];for(const user of db.users){delete user.telegram;delete user.telegramPair;delete user.recoveryHash;delete user.recoveryExpires}});
 });console.log('Hisoblar va oilaviy ma’lumotlar ko‘chirildi. Yangi saytda qayta kiring.');}
 finally{await pool.end()}
}
main().catch(()=>{console.error('Import bajarilmadi. Sozlamalar, fayl formati va manzil bazasi bo‘shligini tekshiring.');process.exitCode=1});
