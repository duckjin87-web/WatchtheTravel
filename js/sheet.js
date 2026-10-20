/* ---------- 시트 ---------- */
const snaps=()=>[176,Math.round(H*.52),H-70];
function setSheet(h,anim){
 sheet.classList.toggle('snap',!!anim);sheet.style.height=h+'px';sheetH=h;
 if(anim){setTimeout(()=>sheet.classList.remove('snap'),260);refit();}else drawMap();
}
let dz=null;
const dzEl=$('#dz');
dzEl.addEventListener('pointerdown',e=>{if(e.target.closest('input,button'))return;dz={y:e.clientY,h:sheetH};dzEl.setPointerCapture(e.pointerId);sheet.classList.remove('snap');});
dzEl.addEventListener('pointermove',e=>{if(!dz)return;const h=Math.max(176,Math.min(H-70,dz.h+dz.y-e.clientY));sheet.style.height=h+'px';sheetH=h;drawMap();});
dzEl.addEventListener('pointerup',e=>{
 if(!dz)return;const dy=dz.y-e.clientY,S2=snaps();let h;
 if(Math.abs(dy)<4)h=sheetH>S2[1]+10?S2[1]:(sheetH>200?S2[0]:S2[1]);
 else{const t=sheetH+(dy>0?40:-40);h=S2.reduce((a,b)=>Math.abs(b-t)<Math.abs(a-t)?b:a);}
 dz=null;setSheet(h,true);
});
dzEl.addEventListener('pointercancel',()=>{dz=null;});

