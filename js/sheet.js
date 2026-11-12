/* ---------- 시트 ----------
   세 단계: 내림(목록 일부) / 중간 / 올림(일정만, 위쪽에 지도가 조금 보임).
   손잡이·제목·날짜 탭 줄을 위아래로 끌어 움직이고, 올림 상태에서 위쪽 지도를 누르면 중간으로 내려온다. */
const snaps=()=>[176,Math.round(H*.52),H-96];
function setSheet(h,anim){
 sheet.classList.toggle('snap',!!anim);sheet.style.height=h+'px';sheetH=h;
 $('#app').classList.toggle('full',h>=snaps()[2]-10);
 if(anim){setTimeout(()=>sheet.classList.remove('snap'),260);refit();}else drawMap();
}
/* 끌기: 세로로 8px 넘게 움직여야 시작한다. 그 전에 손을 떼면 버튼·탭 누르기로 처리된다 */
let dz=null,dragged=false;
function sheetDown(e){
 if(e.target.closest('input,select,[data-drag]'))return;
 dz={y:e.clientY,x:e.clientX,h:sheetH,id:e.pointerId,on:false,el:e.currentTarget};
}
function sheetMove(e){
 if(!dz||e.pointerId!==dz.id)return;
 const dy=dz.y-e.clientY;
 if(!dz.on){
  if(Math.abs(dy)<8||Math.abs(dy)<Math.abs(e.clientX-dz.x))return;
  dz.on=true;dz.el.setPointerCapture(e.pointerId);sheet.classList.remove('snap');
 }
 const S2=snaps(),h=Math.max(S2[0],Math.min(S2[2],dz.h+dy));sheet.style.height=h+'px';sheetH=h;drawMap();
}
function sheetUp(e){
 if(!dz||e.pointerId!==dz.id)return;
 const d=dz;dz=null;
 if(!d.on){
  /* 손잡이·빈 곳을 짧게 누르면 중간 <-> 올림/내림 */
  if(d.el===dzEl&&!e.target.closest('input,button')){const S2=snaps();setSheet(sheetH>S2[1]+10?S2[1]:(sheetH>200?S2[0]:S2[1]),true);}
  return;
 }
 dragged=true;setTimeout(()=>{dragged=false;},0);
 const dy=d.y-e.clientY,S2=snaps(),t=sheetH+(dy>0?40:-40);
 setSheet(S2.reduce((a,b)=>Math.abs(b-t)<Math.abs(a-t)?b:a),true);
}
const dzEl=$('#dz');
[dzEl,$('#grab')].forEach(el=>{
 el.addEventListener('pointerdown',sheetDown);
 el.addEventListener('pointermove',sheetMove);
 el.addEventListener('pointerup',sheetUp);
 el.addEventListener('pointercancel',()=>{dz=null;});
});
/* 끌기가 끝난 직후의 클릭(탭 바뀜 등)은 무시한다 */
sheet.addEventListener('click',e=>{if(dragged){e.stopPropagation();e.preventDefault();}},true);
$('#veil').addEventListener('click',()=>setSheet(snaps()[1],true));
