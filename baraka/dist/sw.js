'use strict';
// Push carries no financial payload. A generic notification is always shown.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{event.waitUntil(self.registration.showNotification('Baraka · muhim sanalar',{body:'Yaqinlashayotgan reja, uchrashuv va to‘lovlaringizni tekshiring.',icon:'/favicon.svg',badge:'/favicon.svg',tag:'baraka-reminders',data:{url:'/app.html#calendar'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const local=windows.filter(client=>new URL(client.url).origin===self.location.origin);const existing=local.find(client=>new URL(client.url).pathname==='/app.html')||local[0];if(existing){const navigated=await existing.navigate('/app.html#calendar');if(navigated)return navigated.focus()}return self.clients.openWindow('/app.html#calendar')})())});
// Cache the application shell only. API responses and personal data never enter Cache Storage.
const SHELL='baraka-shell-v6';
const FILES=['/app.html','/style.css','/app.js','/model.js','/sync.js','/life.js','/locale.js','/day.js','/places.js','/favorites.js','/favicon.svg','/manifest.webmanifest'];
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('baraka-shell-')&&key!==SHELL)await caches.delete(key)})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!FILES.includes(url.pathname))return;event.respondWith((async()=>{const cache=await caches.open(SHELL);try{const response=await fetch(event.request);if(response.ok&&!response.redirected)await cache.put(url.pathname,response.clone());return response}catch(error){const cached=await cache.match(url.pathname);if(cached)return cached;throw error}})())});

self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(SHELL);await Promise.allSettled(FILES.map(async url=>{const r=await fetch(url,{credentials:'same-origin'});if(r.ok&&!r.redirected)await cache.put(url,r)}))})()));
