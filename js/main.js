/* ---------- 시작 ---------- */
function init(){
 size();
 setSheet(Math.round(H*.52),false);
 fitTo(dayPts(0));renderAll();
}
window.addEventListener('resize',()=>{size();const S2=snaps();setSheet(Math.min(sheetH,S2[2]),false);refit();});
function boot(){
 if(CONFIG.USE_MOCK){init();return;}
 loadKakao().then(()=>{KM=kakaoMap();init();})
  .catch(e=>{console.warn(e);init();toast('카카오맵을 불러오지 못해 예시 지도로 보여줘요');});
}
requestAnimationFrame(boot);
