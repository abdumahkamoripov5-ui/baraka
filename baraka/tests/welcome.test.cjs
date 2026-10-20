'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Store}=require('../lib/store.cjs');
const {createAPI}=require('../lib/api.cjs');
// A small DOM adapter lets the actual welcome controller talk to the actual API
// without a network listener. Layout and browser rendering are separate checks.
function entry(t,scene=false){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'baraka-welcome-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const store=new Store(dir),api=createAPI({store,origin:'http://localhost:3000',push:{ready:false,publicKey:'test'}});
 function node(extra={}){return Object.assign({events:{},attributes:{},dataset:{},style:{},value:'',textContent:'',disabled:false,hidden:false,required:false,tabIndex:0,addEventListener(type,fn){this.events[type]=fn},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},focus(){this.focused=true},setCustomValidity(v){this.validation=v},reportValidity(){return true},querySelector(){return null}},extra)}
 const fields={name:node(),email:node(),password:node({type:'password'}),passwordConfirm:node()};
 const submit=node({firstElementChild:node()}),status=node();
 const registerFields=[node({querySelector:()=>fields.name}),node({querySelector:()=>fields.passwordConfirm}),node()];
 const form=node({elements:fields,querySelector:()=>submit,querySelectorAll:()=>registerFields});
 const tabs=['login','register'].map(mode=>node({dataset:{authMode:mode}}));
 const nodes={'#auth-form':form,'#auth-status':status,'#switch-mode':node(),'.auth-switch':node({firstChild:{textContent:''}}),'.password-toggle':node(),'.earthrise':node(),'.dust':node({width:0,height:0,clientWidth:100,clientHeight:100,getContext:()=>null}),'.hero-title':node(),'.dust-veil':node(),'.hud':node(),'#login-tab':tabs[0],'#register-tab':tabs[1]};
 const classes=()=>({values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k)}});
 let sceneP=0,frame=null;
 const chapters=Array.from({length:3},()=>node()),steps=Array.from({length:4},()=>node({classList:classes()}));
 if(scene){
  nodes['.family-journey']=node({getBoundingClientRect:()=>({top:-sceneP*4800,bottom:5800-sceneP*4800,height:5800})});
  for(const key of ['.exterior-shot','.interior-shot','.entry-frame','.journey-welcome','.journey-arrival','.journey-percent','.journey-scroll'])nodes[key]=node();
  nodes['.welcome-header']=node({classList:classes()});
 }
 let cookie='',destination='',offline=false;
 const calls=[];
 const context={console,AbortSignal,performance:{now:()=>0},devicePixelRatio:1,crypto:require('node:crypto').webcrypto,
  location:{protocol:'http:',replace:v=>destination=v},localStorage:{setItem(){}},
  document:{hidden:false,querySelector:s=>nodes[s],querySelectorAll:s=>s==='[data-auth-mode]'?tabs:s==='.story-chapter'?chapters:s==='.journey-steps li'?steps:[],addEventListener(){}},
  matchMedia:()=>({matches:false,addEventListener(){}}),ResizeObserver:class{observe(){}},
  innerHeight:1000,requestAnimationFrame:fn=>{frame=fn;return 1},cancelAnimationFrame(){},addEventListener(){},
  fetch:async(url,options={})=>{if(offline)throw Error('offline');calls.push(url);try{const result=await api.dispatch({method:options.method||'GET',url,headers:{origin:'http://localhost:3000','content-type':'application/json',cookie},socket:{remoteAddress:'welcome-test'}},url,options.body?JSON.parse(options.body):{});if(result.headers?.['Set-Cookie'])cookie=result.headers['Set-Cookie'].split(';')[0];return{ok:true,json:async()=>result.body}}catch(error){return{ok:false,status:error.status||500,json:async()=>({error:error.message})}}}
 };
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/welcome.js'),'utf8'),context);
 return{store,fields,submit,status,form,tabs,calls,nodes,chapters,steps,frame(p){sceneP=p;const fn=frame;frame=null;fn()},get destination(){return destination},set offline(v){offline=v},async ready(){await new Promise(resolve=>setImmediate(resolve))},async send(){await form.events.submit({preventDefault(){}})}};
}
test('new visitor registers from the landing page and enters an empty personal account',async t=>{
 const b=entry(t);await b.ready();assert.equal(b.destination,'');
 b.tabs[1].events.click();Object.assign(b.fields.name,{value:'Malika'});b.fields.email.value='malika@example.com';b.fields.password.value='Strong-passphrase-2026!';b.fields.passwordConfirm.value=b.fields.password.value;
 await b.send();assert.ok(b.calls.includes('/api/auth/register'));assert.equal(b.destination,'app.html#today');assert.equal(b.store.data.users[0].name,'Malika');assert.equal(b.store.data.households[0].state.transactions.length,0);
});
test('mismatched passwords, wrong login and offline failures keep the visitor on the landing',async t=>{
 const b=entry(t);await b.ready();b.tabs[1].events.click();b.fields.name.value='Malika';b.fields.email.value='malika@example.com';b.fields.password.value='Strong-passphrase-2026!';b.fields.passwordConfirm.value='different';
 await b.send();assert.equal(b.destination,'');assert.equal(b.store.data.users.length,0);assert.ok(b.fields.passwordConfirm.validation);
 b.tabs[0].events.click();await b.send();assert.equal(b.destination,'');assert.match(b.status.textContent,/Email yoki parol/);assert.equal(b.submit.disabled,false);
 b.offline=true;await b.send();assert.equal(b.destination,'');assert.match(b.status.textContent,/Server bilan aloqa/);assert.equal(b.submit.disabled,false);
});

test('scroll enters the home, reveals one benefit at a time and ends on the login invitation',async t=>{
 const b=entry(t,true);await b.ready();
 b.frame(0);assert.equal(Number(b.nodes['.exterior-shot'].style.opacity),1);assert.equal(Number(b.nodes['.interior-shot'].style.opacity),0);assert.equal(b.nodes['.journey-arrival'].inert,true);
 b.frame(.28);assert.ok(Number(b.chapters[0].style.opacity)>.95);assert.equal(b.chapters[1].inert,true);assert.notEqual(b.nodes['.exterior-shot'].style.transform,'scale(1)');
 b.frame(.52);assert.ok(Number(b.nodes['.interior-shot'].style.opacity)>.5);assert.ok(Number(b.chapters[1].style.opacity)>.95);assert.equal(b.chapters[0].inert,true);
 b.frame(.74);assert.equal(Number(b.nodes['.interior-shot'].style.opacity),1);assert.ok(Number(b.chapters[2].style.opacity)>.95);
 b.frame(.96);assert.equal(b.nodes['.journey-arrival'].inert,false);assert.equal(Number(b.nodes['.journey-arrival'].style.opacity),1);assert.equal(b.steps[3].attributes['aria-current'],'step');
});
