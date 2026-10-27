'use strict';
const {Pool}=require('pg');

function emptyDatabase(){return {version:1,users:[],households:[],sessions:[],invites:[],subscriptions:[],payments:[],events:[],notificationLog:[],voiceJobs:[]}}
class SnapshotStore{
 constructor(data){
  if(data?.version!==1||!Array.isArray(data.users))throw Error('Ma’lumotlar bazasi formati noto‘g‘ri.');
  this.data=data;this.dirty=false;
 }
 update(fn){const draft=structuredClone(this.data);const result=fn(draft);this.data=draft;this.dirty=true;return result}
}

// Pilot-sized database: serialize requests across ALL function instances, not just
// within one process. Keep the existing synchronous domain mutations, then commit
// their complete snapshot before returning any response/cookie to the browser.
function createDatabase(pool){
 return {async transaction(work){
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   await client.query("SET LOCAL lock_timeout = '15s'");
   await client.query("SET LOCAL statement_timeout = '20s'");
   await client.query("SET LOCAL idle_in_transaction_session_timeout = '60s'");
   await client.query('SELECT pg_advisory_xact_lock(184203, 1)');
   await client.query('CREATE TABLE IF NOT EXISTS baraka_snapshot (id integer PRIMARY KEY CHECK (id = 1), payload jsonb NOT NULL)');
   const result=await client.query('SELECT payload FROM baraka_snapshot WHERE id = 1');
   const store=new SnapshotStore(result.rows[0]?.payload||emptyDatabase());
   const response=await work(store);
   if(store.dirty||!result.rows.length){
    await client.query('INSERT INTO baraka_snapshot (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload',[JSON.stringify(store.data)]);
   }
   await client.query('COMMIT');
   return response;
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
  finally{client.release()}
 }};
}
let database;
function getDatabase(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL sozlanmagan.');
 if(!database){const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000,idleTimeoutMillis:10000,allowExitOnIdle:true});pool.on('error',()=>{});database=createDatabase(pool)}
 return database;
}
module.exports={emptyDatabase,SnapshotStore,createDatabase,getDatabase};
