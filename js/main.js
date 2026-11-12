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
}
window.addEventListener('resize',()=>{size();const S2=snaps();setSheet(Math.min(sheetH,S2[2]),false);refit();});
function boot(){
 if(CONFIG.USE_MOCK){init();return;}
 loadKakao().then(()=>{KM=kakaoMap();init();})
  .catch(e=>{console.warn(e);init();toast('카카오맵을 불러오지 못해 예시 지도로 보여줘요');});
}
requestAnimationFrame(boot);
