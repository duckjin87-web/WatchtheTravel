/* ---------- 시작 ---------- */
function init(){
 $('#legend').innerHTML=CATS.map(c=>'<span>'+pinSvg(c,14,true)+c+'</span>').join('');
 size();loadTrip();
 /* 공유 링크(#s=)로 열었으면 받은 여행 화면부터 */
 const inc=location.hash.indexOf('#s=')===0,st=inc?null:startTrip();if(st)trip=st;
 $('#title').value=trip.title;$('#dstart').value=trip.start;
 setSheet(Math.round(H*.52),false);
 if(!st&&!inc)openHome();
 fitTo(dayPts(sd));renderAll();
 if(inc)openIncoming();
 hideSplash(false);
}
window.addEventListener('resize',()=>{size();const S2=snaps();setSheet(Math.min(sheetH,S2[2]),false);refit();});
function boot(){
 if(CONFIG.USE_MOCK){init();return;}
 loadKakao().then(()=>{KM=kakaoMap();init();})
  .catch(e=>{console.warn(e);init();toast('카카오맵을 불러오지 못해 예시 지도로 보여줘요');});
}
/* 시작 화면 닫기: 최소 1.9초는 보여주고, 누르면 바로 닫는다. 지도를 못 불러와도 5초 뒤에는 닫는다 */
const SP0=Date.now();let spTimer=0;
function hideSplash(now){
 const el=$('#splash');if(!el)return;
 clearTimeout(spTimer);
 spTimer=setTimeout(()=>{el.classList.add('out');document.body.classList.remove('boot');setTimeout(()=>el.remove(),550);},now?0:Math.max(0,1900-(Date.now()-SP0)));
}
if($('#splash')){$('#splash').addEventListener('click',()=>hideSplash(true));setTimeout(()=>hideSplash(true),5000);}
requestAnimationFrame(boot);
/* 앱 설치(PWA): https 에서만 서비스 워커를 등록한다 */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))
 window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
