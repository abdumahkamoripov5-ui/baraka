'use strict';
const {configuration,probeServices}=require('./lib/service-check.cjs');
async function main(){
 console.log('BARAKA · xizmatlar holati\n');
 for(const item of configuration()){
  console.log(`${item.configured?'SOZLANGAN':'SOZLASH KERAK'} · ${item.service}`);
  if(!item.configured)console.log('  Kerak: '+item.needs.join(', '));
  if(item.error)console.log('  '+item.error);
 }
 console.log('\nSozlama mavjudligi jonli ishlash tasdig‘i emas. Maxfiy qiymatlar ko‘rsatilmaydi.');
 if(process.argv.includes('--live')){
  console.log('\nHaqiqiy manbalarga ulanish tekshirilmoqda…');
  for(const item of await probeServices())console.log(`${item.reachable?'ULANDI':'ULANMADI'} · ${item.service}: ${item.reachable?item.source+(item.stops!==undefined?' · '+item.stops+' ta bekat':' · '+item.date):item.error}`);
 }else console.log('Namoz va bekat manbalarini tekshirish: npm run services:check -- --live');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
