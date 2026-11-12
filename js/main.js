/* ---------- 시작 ---------- */
function init(){
 $('#legend').innerHTML=CATS.map(c=>'<span>'+pinSvg(c,14,true)+c+'</span>').join('');
 size();loadTrip();
 const st=startTrip();if(st)trip=st;
 $('#title').value=trip.title;$('#dstart').value=trip.start;
 setSheet(Math.round(H*.52),false);
 if(!st)openHome();
 fitTo(dayPts(sd));renderAll();
}
window.addEventListener('resize',()=>{size();const S2=snaps();setSheet(Math.min(sheetH,S2[2]),false);refit();});
function boot(){
 if(CONFIG.USE_MOCK){init();return;}
 loadKakao().then(()=>{KM=kakaoMap();init();})
  .catch(e=>{console.warn(e);init();toast('카카오맵을 불러오지 못해 예시 지도로 보여줘요');});
}
requestAnimationFrame(boot);
