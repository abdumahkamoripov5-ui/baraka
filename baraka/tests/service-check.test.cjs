'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {configuration,probeServices}=require('../lib/service-check.cjs');
test('readiness identifies missing providers and never exposes credential values',()=>{
 const result=configuration({APP_ORIGIN:'http://localhost:3000',VOICE_TWILIO_AUTH_TOKEN:'SECRET-MUST-NOT-APPEAR'});
 assert.equal(result.find(r=>r.service==='Jonli avtobus GPS').configured,false);assert.equal(result.find(r=>r.service==='Internetdagi server').configured,false);assert.ok(!JSON.stringify(result).includes('SECRET-MUST-NOT-APPEAR'));
});
test('read-only probes validate actual provider responses and never report stop data as live GPS',async()=>{
 const calls=[];const result=await probeServices({now:()=>Date.parse('2026-10-20T08:00:00Z'),send:async(url,options)=>{
  calls.push(String(url));assert.ok(!String(url).includes('twilio'));assert.ok(!String(url).includes('paycom'));
  return{ok:true,json:async()=>String(url).includes('aladhan')?{code:200,data:{date:{gregorian:{date:'20-10-2026'}},timings:{Fajr:'05:30',Sunrise:'06:45',Dhuhr:'12:15',Asr:'16:00',Maghrib:'17:45',Isha:'19:00'}}}:{elements:[{type:'node',id:1,lat:41.3,lon:69.2,tags:{name:'Bekat'}}]}};
 }});
 assert.equal(calls.length,2);assert.ok(result.every(r=>r.reachable));assert.equal(result[1].stops,1);assert.equal(result[1].liveGPS,false);
});
test('provider failures are displayed honestly',async()=>{
 const result=await probeServices({send:async()=>{throw Error('network unavailable')}});assert.ok(result.every(r=>!r.reachable&&r.status===502));
});
