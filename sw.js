/* 앱 설치(PWA)용 서비스 워커.
   같은 사이트의 화면 파일은 "네트워크 먼저, 안 되면 저장본"으로 내준다: 온라인이면 늘 최신 배포를 쓰고,
   오프라인이면 마지막으로 받은 화면으로 열린다. api/ 와 다른 사이트(카카오 지도 등)는 건드리지 않는다. */
const CACHE='wt-shell-v3';
const SHELL=['./','index.html','manifest.webmanifest','css/style.css','icons/icon-192.png','img/splash.jpg',
 'js/config.js','js/util.js','js/data.js','js/core.js','js/map.js','js/sheet.js','js/ui.js','js/gps.js',
 'js/kakao.js','js/route.js','js/trips.js','js/plan.js','js/share.js','js/backup.js','js/nav.js','js/main.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
 e.respondWith(fetch(r).then(res=>{
  if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}
  return res;
 }).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))));
});
