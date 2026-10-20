'use strict';
// Push carries no financial payload. A generic notification is always shown.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{event.waitUntil(self.registration.showNotification('Baraka · muhim sanalar',{body:'Yaqinlashayotgan reja, uchrashuv va to‘lovlaringizni tekshiring.',icon:'/favicon.svg',badge:'/favicon.svg',tag:'baraka-reminders',data:{url:'/#calendar'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const existing=windows.find(client=>new URL(client.url).origin===self.location.origin);if(existing){await existing.navigate('/#calendar');return existing.focus()}return self.clients.openWindow('/#calendar')})())});
