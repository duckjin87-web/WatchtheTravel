/* ---------- 시작 ---------- */
function init(){
 size();
 setSheet(Math.round(H*.52),false);
 fitTo(dayPts(0));renderAll();
}
window.addEventListener('resize',()=>{size();const S2=snaps();setSheet(Math.min(sheetH,S2[2]),false);refit();});
requestAnimationFrame(init);
