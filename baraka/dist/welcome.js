'use strict';
(function(){
 const form=document.querySelector('#auth-form');
 const status=document.querySelector('#auth-status');
 const submit=form.querySelector('[type=submit]');
 const tabs=[...document.querySelectorAll('[data-auth-mode]')];
 let mode='login',busy=false;
 const routes=new Set(['today','tasks','prayer','transport','home','transactions','family','goals','debts','bills','report','settings','wallets','calendar','utilities']);
 const route=routes.has(location.hash?.slice(1))?location.hash:'#today';
 const appURL='app.html'+route;
 function setMode(next){
  if(busy)return;
  mode=next==='register'?'register':'login';
  tabs.forEach(tab=>{const selected=tab.dataset.authMode===mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1});
  form.setAttribute('aria-labelledby',mode+'-tab');
  form.querySelectorAll('.register-field').forEach(el=>{el.hidden=mode!=='register';const input=el.querySelector('input');if(input){input.disabled=mode!=='register';input.required=mode==='register'}});
  form.elements.password.autocomplete=mode==='register'?'new-password':'current-password';
  form.elements.password.placeholder=mode==='register'?'Kamida 12 belgi':'Parolingizni kiriting';
  if(mode==='register')form.elements.password.minLength=12;else form.elements.password.removeAttribute('minlength');
  form.elements.passwordConfirm.setCustomValidity('');
  submit.firstElementChild.textContent=mode==='register'?'Hisob yaratish':'Kirish';
  document.querySelector('.auth-switch').firstChild.textContent=mode==='register'?'Hisobingiz bormi? ':'Yangi foydalanuvchimisiz? ';
  document.querySelector('#switch-mode').textContent=mode==='register'?'Kirish':'Hisob yarating';
  status.textContent='';
 }
 tabs.forEach(tab=>{tab.addEventListener('click',()=>setMode(tab.dataset.authMode));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'login':e.key==='End'?'register':mode==='login'?'register':'login';setMode(next);document.querySelector('#'+mode+'-tab').focus()}})});
 document.querySelectorAll('[data-mode]').forEach(link=>link.addEventListener('click',()=>setMode(link.dataset.mode)));
 document.querySelector('#switch-mode').addEventListener('click',()=>setMode(mode==='login'?'register':'login'));
 form.addEventListener('input',()=>{form.elements.passwordConfirm.setCustomValidity('');status.textContent=''});
 document.querySelector('.password-toggle').addEventListener('click',e=>{const input=form.elements.password,show=input.type==='password';input.type=show?'text':'password';e.currentTarget.textContent=show?'Yashirish':'Ko‘rsatish';e.currentTarget.setAttribute('aria-pressed',String(show));e.currentTarget.setAttribute('aria-label',show?'Parolni yashirish':'Parolni ko‘rsatish')});
 async function request(path,body){
  if(location.protocol==='file:')throw Error('Hisobga kirish uchun Baraka serverini ishga tushiring va saytni uning http manzilida oching.');
  let response;
  try{response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)})}catch{throw Error('Server bilan aloqa yo‘q. Server ishlayotganini tekshiring va yana urinib ko‘ring.')}
  let data;try{data=await response.json()}catch{throw Error('Server javobi noto‘g‘ri. Saytni Baraka serveri orqali oching.')}
  if(!response.ok){const error=Error(data.error||'So‘rov bajarilmadi. Yana urinib ko‘ring.');error.status=response.status;throw error}
  return data;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  if(mode==='register'&&form.elements.password.value!==form.elements.passwordConfirm.value){form.elements.passwordConfirm.setCustomValidity('Parollar bir xil emas.');form.elements.passwordConfirm.reportValidity();return}
  if(!form.reportValidity())return;
  const body={email:form.elements.email.value.trim(),password:form.elements.password.value};
  if(mode==='register')body.name=form.elements.name.value.trim();
  busy=true;submit.disabled=true;form.setAttribute('aria-busy','true');tabs.forEach(tab=>tab.disabled=true);status.textContent=mode==='register'?'Hisob yaratilmoqda…':'Hisobingiz tekshirilmoqda…';
  try{await request(mode==='register'?'/api/auth/register':'/api/auth/login',body);try{localStorage.setItem('baraka-auth-event',JSON.stringify({action:'login',nonce:crypto.randomUUID()}))}catch{}status.textContent='Tayyor. Shaxsiy makoningiz ochilmoqda…';location.replace(appURL)}catch(error){status.textContent=error.message;status.setAttribute('tabindex','-1');status.focus()}finally{busy=false;submit.disabled=false;form.removeAttribute('aria-busy');tabs.forEach(tab=>tab.disabled=false)}
 });
 // The server cookie is the only authority. Never store passwords or tokens.
 if(location.protocol!=='file:')request('/api/auth/me').then(()=>{if(!busy&&!/[?&]preview=home(?:&|$)/.test(location.search||''))location.replace(appURL)}).catch(error=>{if(error.status!==401)status.textContent=error.message});

 // A scroll-directed dolly-in: approach the home, cross the doorway, then
 // meet the family. One frame loop owns every scene and chapter transition.
 // These are two photographic shots, not a video or a live 3D interior.
 const root=document.querySelector('.family-journey');
 if(!root)return;
 const exterior=document.querySelector('.exterior-shot');
 const interior=document.querySelector('.interior-shot');
 const entry=document.querySelector('.entry-frame');
 const welcome=document.querySelector('.journey-welcome');
 const arrival=document.querySelector('.journey-arrival');
 const chapters=[...document.querySelectorAll('.story-chapter')];
 const steps=[...document.querySelectorAll('.journey-steps li')];
 const header=document.querySelector('.welcome-header');
 const percent=document.querySelector('.journey-percent');
 const phone=document.querySelector('.family-phone');
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 const continuation=document.querySelector('.home-continuation');
 const benefits=document.querySelector('#possibilities');
 const cards=benefits?[...benefits.querySelectorAll('.possibility-list li')]:[];
 // One observer reveals ordinary document content; it starts no animation loop.
 if(typeof IntersectionObserver==='function'){
  document.body.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('is-visible');observer.unobserve(target)}})},{threshold:.12});
  document.querySelectorAll('[data-enter]').forEach(el=>observer.observe(el));
  document.addEventListener('focusin',event=>{const panel=event.target.closest?.('[data-enter]');if(panel)panel.classList.add('is-visible');const card=event.target.closest?.('.possibility-list li');if(card){card.style.setProperty('--benefit-opacity','1');card.style.setProperty('--benefit-y','0px');card.style.setProperty('--benefit-blur','0px')}});
 }
 let lastBenefit=-1;
 function paintContinuation(vh){
  if(!continuation||!benefits)return;
  const rect=benefits.getBoundingClientRect();
  const p=mq.matches?1:clamp(-rect.top/Math.max(1,rect.height-vh));
  if(Math.abs(p-lastBenefit)<.00005)return;
  lastBenefit=p;
  continuation.style.setProperty('--room-scale',String(mq.matches?1:1.06-p*.06));
  benefits.style.setProperty('--benefit-progress',String(p));
  cards.forEach((card,i)=>{
   const enter=mq.matches?1:ease(range(p,.04+i*.22,.24+i*.22));
   // Preserve the focused card when navigating with the keyboard.
   const k=card.contains(document.activeElement)?1:enter;
   card.style.setProperty('--benefit-opacity',String(.08+k*.92));
   card.style.setProperty('--benefit-y',`${(1-k)*35}px`);
   card.style.setProperty('--benefit-blur',`${(1-k)*3}px`);
  });
 }
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const range=(v,a,b)=>clamp((v-a)/(b-a));
 const ease=t=>t*t*(3-2*t);
 let raf=0,lastP=-1,lastPaper=null;
 const windows=[[.18,.24,.34,.40],[.40,.46,.59,.65],[.65,.71,.79,.85]];
 function text(el,opacity,y=0){
  el.style.opacity=String(opacity);
  el.style.transform=`translate3d(0,calc(-50% + ${y}px),0)`;
  el.inert=opacity<.08;
  el.setAttribute('aria-hidden',String(opacity<.08));
 }
 function paint(){
  const rect=root.getBoundingClientRect(),vh=innerHeight;
  paintContinuation(vh);
  const paper=rect.bottom<90;
  if(paper!==lastPaper){header.classList.toggle('on-paper',paper);lastPaper=paper}
  if(mq.matches){
   [exterior,interior,entry,welcome,arrival,...chapters].forEach(el=>{el.style.opacity='';el.style.transform='';el.inert=false;el.removeAttribute('aria-hidden')});
   if(phone){phone.style.opacity='';phone.style.transform=''}
   lastP=-1;return;
  }
  if(rect.bottom<0||rect.top>vh)return;
  const p=clamp(-rect.top/Math.max(1,rect.height-vh));
  if(Math.abs(p-lastP)<.00005)return;lastP=p;
  const approach=range(p,0,.55);
  exterior.style.transform=`scale(${1+approach*approach*4.6})`;
  exterior.style.opacity=String(1-ease(range(p,.43,.57)));
  interior.style.opacity=String(ease(range(p,.43,.57)));
  interior.style.transform=`scale(${1.17-ease(range(p,.48,1))*.17})`;
  const through=range(p,.39,.63);
  entry.style.opacity=String(range(p,.37,.44)*(1-range(p,.55,.64))*.7);
  entry.style.transform=`scale(${.72+through*1.6})`;
  const intro=1-ease(range(p,.08,.18));text(welcome,intro,-range(p,.08,.18)*20);
  chapters.forEach((el,i)=>{
   const [a,b,c,d]=windows[i],enter=ease(range(p,a,b)),leave=ease(range(p,c,d));
   text(el,enter*(1-leave),(1-enter)*24-leave*24);
  });
  const end=ease(range(p,.85,.92));text(arrival,end,(1-end)*25);
  if(phone){const show=ease(range(p,.57,.68));phone.style.opacity=String(show);phone.style.transform=`translate3d(0,${(1-show)*45}px,0) rotate(7deg)`}
  const current=p<.18?0:p<.43?1:p<.85?2:3;
  steps.forEach((el,i)=>{el.classList.toggle('is-active',i===current);if(i===current)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
  percent.textContent=String(Math.round(p*100)).padStart(2,'0')+'%';
 }
 function loop(){paint();raf=requestAnimationFrame(loop)}
 function start(){cancelAnimationFrame(raf);lastP=-1;lastBenefit=-1;if(mq.matches)paint();else raf=requestAnimationFrame(loop)}
 addEventListener('resize',()=>{lastP=-1;lastBenefit=-1;paint()},{passive:true});
 // In reduced-motion mode the story is ordinary document content.
 addEventListener('scroll',()=>{if(mq.matches)paint()},{passive:true});
 mq.addEventListener('change',start);
 addEventListener('pageshow',start);addEventListener('pagehide',()=>cancelAnimationFrame(raf));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else start()});
 document.querySelector('.journey-scroll').addEventListener('click',e=>{
  if(mq.matches)return;
  e.preventDefault();
  const rect=root.getBoundingClientRect();
  window.scrollTo({top:scrollY+rect.top+(rect.height-innerHeight)*.23,behavior:'smooth'});
 });
 start();
})();
