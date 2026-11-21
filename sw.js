/* 앱 설치용 최소 서비스워커: 페이지는 항상 인터넷에서 받고, 오프라인일 때만 첫 화면을 보여줍니다. */
const C='app-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['index.html'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!=='navigate')return;e.respondWith(fetch(r).catch(()=>caches.match('index.html')))});
