/* 앱 설치용 최소 서비스워커: 페이지는 항상 인터넷에서 받고, 오프라인일 때만 첫 화면을 보여줍니다. */
const C='app-v3';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['index.html'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!=='navigate')return;e.respondWith(fetch(r).catch(()=>caches.match('index.html')))});

/* 광고 차단: 광고 주소와 허용 목록에 없는 외부 script/worker 요청을 막습니다. */
const AD=/doubleclick|googlesyndication|googleadservices|adservice\.google|googletagmanager|googletagservices|google-analytics|adsbygoogle|pagead|adsterra|propellerads|popads|popcash|exoclick|juicyads|trafficjunky|taboola|outbrain|mgid\.com|revcontent|criteo|adnxs|rubiconproject|pubmatic|amazon-adsystem|adform\.net|smartadserver|an\.yandex|yandexadexchange|daumcdn\.net\/kas|adfit|mobon|cauly|tenping|admob|applovin|unityads|chartboost|vungle|ironsrc|monetag|a-ads\.com|admaven|hilltopads|clickadu|richpops|onclickads|ezoic|adskeeper|zeropark|(^|[\/.])ads?[0-9]*\.|\/ads?\/|\/adserver/i,OK=/(^|\.)(accounts\.google\.com|apis\.google\.com|gstatic\.com|www\.googleapis\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.emulatorjs\.org|v8\.js-dos\.com|raw\.githubusercontent\.com|youtube\.com|ytimg\.com)$/i;
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode==='navigate')return;let u;try{u=new URL(r.url)}catch(x){return}if(u.origin===location.origin)return;if(AD.test(r.url)||(['script','worker','sharedworker'].indexOf(r.destination)>=0&&!OK.test(u.hostname)))e.respondWith(new Response('',{status:204}))});
