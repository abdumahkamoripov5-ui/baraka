'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./helpers/app.cjs');
function submit(a,data={}){a.node('#entry-form').events.submit({preventDefault(){},target:{data}});assert.equal(a.node('#form-error').textContent,'');}
function prepare(){const a=app();a.run('state=blankState();render()');return a;}
test('all visible main actions open the right form across the fifteen routes',()=>{
 const a=prepare();for(const route of ['today','tasks','home','transactions','family','goals','debts','bills','report','settings','wallets','calendar','utilities','prayer','transport']){
  a.run(`location.hash='#${route}';render()`);
  if(['prayer','transport'].includes(route)){assert.equal(a.node('#main-add').hidden,true);continue}
  a.node('#main-add').onclick();assert.equal(a.run('formType'),['today','tasks'].includes(route)?'day-task':'transaction');assert.equal(a.node('#modal').open,true);a.run('closeModal()');
 }
});
test('transaction form supports add, edit, filtering, delete and undo',()=>{
 const a=prepare();a.run("openForm('transaction')");const date=a.run('day()');
 const data={name:'Bozorlik',amount:'30000',type:'expense',category:'Oziq-ovqat',member:'Men',date,walletId:'cash'};
 submit(a,data);assert.equal(a.run('state.transactions.length'),1);assert.equal(a.run('totals().expense'),30000);
 a.run("openForm('transaction',state.transactions[0].id)");submit(a,{...data,name:'Yangi bozorlik',amount:'40000'});assert.equal(a.run('state.transactions.length'),1);assert.equal(a.run('totals().expense'),40000);
 a.node('#search').value='yangi';assert.equal(a.run('filteredTransactions().length'),1);a.node('#search').value='yoq';assert.equal(a.run('filteredTransactions().length'),0);
 a.run("removeItem('transaction',state.transactions[0].id)");submit(a);assert.equal(a.run('state.transactions.length'),0);a.run('undoAction()');assert.equal(a.run('state.transactions.length'),1);
});
test('goals, deposits, debts and repayment work through their actual forms',()=>{
 const a=prepare(),date=a.run('day()');a.run("openForm('goal')");submit(a,{name:'Uy',target:'100000',saved:'10000',icon:'🏡',date});
 a.run("openForm('deposit',state.goals[0].id)");submit(a,{direction:'add',amount:'20000'});assert.equal(a.run('state.goals[0].saved'),30000);
 a.run("openForm('deposit',state.goals[0].id)");submit(a,{direction:'withdraw',amount:'5000'});assert.equal(a.run('state.goals[0].saved'),25000);
 a.run("openForm('debt')");submit(a,{name:'Ali',type:'lent',amount:'50000',repaid:'10000',date});a.run("openForm('repay',state.debts[0].id)");submit(a,{amount:'40000'});assert.equal(a.run('remainingDebt(state.debts[0])'),0);
});
test('wallets, internal transfers and utility subscribers can be saved and edited',()=>{
 const a=prepare(),date=a.run('day()');a.run("openForm('wallet')");submit(a,{name:'Yangi karta',walletType:'card',opening:'100000'});assert.equal(a.run('state.wallets.length'),3);
 const id=a.run('state.wallets[2].id');a.run("openForm('transfer')");submit(a,{fromId:id,toId:'cash',amount:'25000',date,note:'Naqd'});assert.equal(a.run('totals().balance'),100000);assert.equal(a.run("walletBalance('cash')"),25000);
 a.run("openForm('utility')");submit(a,{name:'Elektr',service:'electricity',accountNumber:'12345',region:'Toshkent'});assert.equal(a.run('state.utilities.length'),1);
 a.run("openForm('utility',state.utilities[0].id)");submit(a,{name:'Uy elektr',service:'electricity',accountNumber:'54321',region:'Toshkent'});assert.equal(a.run('state.utilities[0].accountNumber'),'54321');
 a.run('removeUtility(state.utilities[0].id)');submit(a);assert.equal(a.run('state.utilities.length'),0);
});
test('tasks, appointments, completion filters and deletion work through form submissions',()=>{
 const a=prepare(),date=a.run('day()');a.run("openForm('day-task')");submit(a,{name:'Vazifa',date,time:'10:00',member:'Men',priority:'normal',remindMinutes:'5'});
 a.run("openForm('day-appointment')");submit(a,{name:'Uchrashuv',date,time:'11:00',kind:'meeting',location:'Ofis',remindMinutes:'15'});assert.equal(a.run('BarakaDay.agenda().length'),2);
 a.run("BarakaDay.toggle('task',state.tasks[0].id)");a.node('#day-filter').value='done';a.run('BarakaDay.filterTasks()');assert.match(a.node('#day-task-list').innerHTML,/Vazifa/);assert.doesNotMatch(a.node('#day-task-list').innerHTML,/Uchrashuv/);
 a.run("BarakaDay.remove('appointment',state.appointments[0].id)");submit(a);assert.equal(a.run('state.appointments.length'),0);
});
test('monthly bill payment creates one expense and advances its date',()=>{
 const a=prepare();a.run("openForm('bill')");submit(a,{name:'Internet',amount:'100000',date:'2026-01-31',frequency:'monthly',category:'Uy va kommunal'});
 a.run('confirmBill(state.bills[0].id)');submit(a);assert.equal(a.run('state.transactions.length'),1);assert.equal(a.run('state.bills[0].date'),'2026-02-28');assert.equal(a.run('state.bills[0].anchorDay'),31);
});
test('read-only calculator cannot submit or close accidentally when Enter is pressed',()=>{
 const a=prepare();a.run('openCalculator()');a.node('#entry-form').events.submit({preventDefault(){},target:{data:{}}});assert.equal(a.node('#modal').open,true);assert.equal(a.run('formType'),'calculator');assert.equal(a.storage.get('baraka-v1'),undefined);
});
test('changing prayer city during a request allows the new city request immediately',async()=>{
 const a=prepare();a.run("location.hash='#prayer';render();var requests=[];var resolves=[];globalThis.barakaCloud={paint(){},request(url){requests.push(url);return new Promise(resolve=>resolves.push(resolve))}};");
 const first=a.run('BarakaDay.loadPrayer()');a.run("BarakaDay.changeCity('samarkand')");const second=a.run('BarakaDay.loadPrayer()');
 assert.equal(a.run('requests.length'),2);a.run("resolves[1]({cityId:'samarkand',date:BarakaDay.ui.date,method:3,timings:{}})");await second;
 a.run("resolves[0]({cityId:'tashkent',date:BarakaDay.ui.date,method:3,timings:{}})");await first;assert.equal(a.run('BarakaDay.ui.prayer.cityId'),'samarkand');
});
test('old prayer errors cannot replace the schedule from a newer date request',async()=>{
 const a=prepare();a.run("location.hash='#prayer';BarakaDay.ui.date='2026-10-20';var resolves=[],rejects=[];globalThis.barakaCloud={paint(){},request(){return new Promise((resolve,reject)=>{resolves.push(resolve);rejects.push(reject)})}}");
 const old=a.run('BarakaDay.loadPrayer()');a.run("BarakaDay.setPrayerDate('2026-10-21')");const current=a.run('BarakaDay.loadPrayer()');assert.equal(a.run('resolves.length'),2);
 a.run("resolves[1]({cityId:'tashkent',city:'Toshkent',date:'2026-10-21',timezone:'Asia/Tashkent',method:3,timings:{Fajr:'05:30',Sunrise:'06:45',Dhuhr:'12:15',Asr:'16:00',Maghrib:'17:45',Isha:'19:00'},fetchedAt:Date.now()})");await current;
 a.run("rejects[0](Error('Old request failed'))");await old;assert.equal(a.run('BarakaDay.ui.prayerError'),'');assert.equal(a.run('BarakaDay.ui.prayerLoading'),false);assert.match(a.node('#prayer-result').innerHTML,/05:30/);
});
test('transport city changes replace stale requests and preserve the active search',async()=>{
 const a=prepare();a.run("location.hash='#transport';render();var resolves=[],rejects=[];globalThis.barakaCloud={paint(){},request(){return new Promise((resolve,reject)=>{resolves.push(resolve);rejects.push(reject)})}}");
 const old=a.run('BarakaDay.loadTransit()');a.run("BarakaDay.changeCity('samarkand')");const current=a.run('BarakaDay.loadTransit()');assert.equal(a.run('resolves.length'),2);a.node('#bus-search').value='Markaz';
 a.run("resolves[1]({cityId:'samarkand',source:'Test operator',fetchedAt:Date.now(),live:false,center:{lat:39.65,lon:66.95},stops:[{id:'s1',name:'Markaz',lat:39.65,lon:66.95},{id:'s2',name:'Boshqa',lat:39.66,lon:66.96}],routes:[],vehicles:[],arrivals:[]})");await current;
 a.run("rejects[0](Error('Old transport failure'))");await old;assert.equal(a.run('BarakaDay.ui.transitError'),'');assert.equal(a.run('BarakaDay.ui.transit.cityId'),'samarkand');assert.match(a.node('#bus-stop-list').innerHTML,/Markaz/);assert.doesNotMatch(a.node('#bus-stop-list').innerHTML,/Boshqa/);assert.equal(a.node('#bus-search').value,'Markaz');
});
test('new GPS coordinates can be requested while the city-centre search is still pending',async()=>{
 const a=prepare();a.run("location.hash='#transport';var resolves=[];globalThis.barakaCloud={paint(){},request(){return new Promise(resolve=>resolves.push(resolve))}}");
 a.run('BarakaDay.loadTransit()');a.run('BarakaDay.ui.coords={lat:41.3,lon:69.2}');a.run('BarakaDay.loadTransit()');assert.equal(a.run('resolves.length'),2);
});
test('transport map tiles cover wide desktop and narrow mobile viewports',()=>{
 const a=prepare();a.run("BarakaDay.ui.transit={center:{lat:41.3,lon:69.2},stops:[],vehicles:[],routes:[],arrivals:[]}");
 for(const width of [390,768,1280,1920]){
  a.node('#bus-map').clientWidth=width;a.node('#bus-map').clientHeight=340;a.run('BarakaDay.showMap()');
  const tiles=[...a.node('#bus-map').innerHTML.matchAll(/class="map-tile"[^>]*style="left:([-\d.]+)px;top:([-\d.]+)px"/g)].map(m=>({left:Number(m[1]),top:Number(m[2])}));
  assert.ok(tiles.length>0);assert.ok(Math.min(...tiles.map(t=>t.left))<=-width/2,`left edge ${width}`);assert.ok(Math.max(...tiles.map(t=>t.left+256))>=width/2,`right edge ${width}`);assert.ok(Math.min(...tiles.map(t=>t.top))<=-170);assert.ok(Math.max(...tiles.map(t=>t.top+256))>=170);
 }
});
test('CSV export protects formulas and backup files restore through the actual import control',async()=>{
 const a=prepare(),date=a.run('day()');a.run("var downloads=[];download=(content,type,filename)=>downloads.push({content,type,filename})");
 a.run("openForm('transaction')");submit(a,{name:'=SUM(1+1)',amount:'50000',type:'income',category:'Boshqa',member:'Men',date,walletId:'card'});
 a.run('exportTransactions();exportBackup()');assert.match(a.run('downloads[0].content'),/"'=SUM\(1\+1\)"/);const backup=a.run('downloads[1].content');assert.equal(JSON.parse(backup).state.transactions.length,1);
 a.run('state=blankState()');const file={size:Buffer.byteLength(backup),text:async()=>backup};await a.node('#import-file').events.change({target:{files:[file],value:'backup.json'}});submit(a);assert.equal(a.run('state.transactions.length'),1);assert.equal(a.run('state.transactions[0].amount'),50000);
});
test('theme, privacy and motion preferences persist and calendar controls navigate',()=>{
 const a=prepare();a.run('toggleTheme();togglePrivacy();toggleMotion()');const prefs=JSON.parse(a.storage.get('baraka-preferences'));assert.equal(prefs.theme,'dark');assert.equal(prefs.privacy,true);assert.equal(prefs.motion,false);
 const initial=a.run('dateKey(calendarCursor)');a.run('moveCalendar(1)');assert.notEqual(a.run('dateKey(calendarCursor)'),initial);a.run('resetCalendar()');assert.equal(a.run('calendarSelected'),a.run('day()'));
});
