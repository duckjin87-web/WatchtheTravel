/* ---------- 지도 ---------- */
const map=$('#map'),sheet=$('#sheet'),list=$('#list');
let KM=null,W=0,H=0,sheetH=420,V={cx:45,cy:20,s:4},T={cx:45,cy:20,s:4},raf=0;
const ISL=[],RING=[];
for(let a=0;a<6.2832;a+=.12){const r=1+.03*Math.sin(3*a+1)+.025*Math.sin(5*a+2);
 ISL.push([45+41*r*Math.cos(a),20.5+18.5*r*Math.sin(a)]);
 RING.push([45+41*.86*Math.cos(a),20.5+18.5*.8*Math.sin(a)]);}
const CROSS=[[6,24],[20,20],[45,19],[70,19],[84,18]];
const size=()=>{const a=map.parentNode;W=a.clientWidth;H=a.clientHeight;};
const vb=()=>{const top=64,bot=Math.max(H-sheetH,top+140);return[top,bot];};
const pr=(x,y)=>{const b=vb();return[(x-V.cx)*V.s+W/2,(y-V.cy)*V.s+(b[0]+b[1])/2];};
const path=(pts,closed)=>pts.map((p,i)=>{const q=pr(p[0],p[1]);return(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1);}).join('')+(closed?'Z':'');

/* 선과 반경 원은 SVG로, 마커는 카카오맵과 같은 HTML로 #mk 위에 올린다 */
const mkEl=$('#mk');let MK=[];
function drawMap(){
 if(KM)return KM.draw();
 size();if(!W||!H)return;
 let o='<rect class="sea" width="'+W+'" height="'+H+'"/>';
 o+='<path class="land" d="'+path(ISL,true)+'"/>';
 const rw=Math.min(8,Math.max(2,V.s*.22));
 o+='<path class="road" stroke-width="'+rw+'" d="'+path(RING,true)+'"/><path class="road" stroke-width="'+rw+'" d="'+path(CROSS,false)+'"/>';
 if(V.s<16){const h=pr(45,20);o+='<path d="M'+(h[0]-8)+' '+(h[1]+5)+'L'+h[0]+' '+(h[1]-7)+'L'+(h[0]+8)+' '+(h[1]+5)+'Z" fill="var(--ink3)" opacity=".5"/><text class="mt" x="'+h[0]+'" y="'+(h[1]+18)+'" text-anchor="middle">한라산</text>';}
 const sc=scene();
 if(sc.circle){const q=pr(sc.circle.p.x,sc.circle.p.y);o+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(sc.circle.r*V.s)+'" fill="var(--ink)" fill-opacity=".05" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 5"/>';}
 sc.lines.sort((a,b)=>a.z-b.z).forEach(l=>{
  const d=path(l.pts.map(p=>[p.x,p.y]),false);
  if(l.halo)o+='<path d="'+d+'" fill="none" stroke="var(--halo)" stroke-width="'+(l.w+3.5)+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+(l.op===1?.9:.5)+'"/>';
  o+='<path d="'+d+'" fill="none" stroke="'+l.c+'" stroke-width="'+l.w+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+l.op+'"'+(l.dash?' stroke-dasharray="5 5"':'')+'/>';
 });
 map.innerHTML=o;
 MK=sc.marks.filter(m=>{if(!m.need)return true;const a=pr(m.need[0].x,m.need[0].y),b=pr(m.need[1].x,m.need[1].y);return Math.hypot(a[0]-b[0],a[1]-b[1])>=56;});
 mkEl.innerHTML=MK.map((m,k)=>{const q=pr(m.p.x,m.p.y);return '<div class="mk" data-k="'+k+'" style="left:'+q[0].toFixed(1)+'px;top:'+q[1].toFixed(1)+'px;z-index:'+m.z+(m.click?'':';pointer-events:none')+'">'+m.h+'</div>';}).join('');
}
mkEl.addEventListener('click',e=>{const g=e.target.closest('[data-k]'),m=g&&MK[+g.dataset.k];if(m&&m.click)m.click();});
function go(){
 cancelAnimationFrame(raf);
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){V={cx:T.cx,cy:T.cy,s:T.s};drawMap();return;}
 const step=()=>{
  V.cx+=(T.cx-V.cx)*.22;V.cy+=(T.cy-V.cy)*.22;V.s+=(T.s-V.s)*.22;drawMap();
  const px=Math.hypot((T.cx-V.cx)*V.s,(T.cy-V.cy)*V.s)+Math.abs(T.s-V.s)*4;
  if(px>.4)raf=requestAnimationFrame(step);else{V={cx:T.cx,cy:T.cy,s:T.s};drawMap();}
 };step();
}
function fitTo(pts,extra){
 if(KM)return KM.fit(pts,extra);
 size();extra=extra||0;const b=vb(),vh=b[1]-b[0]-56,vw=W-56;
 if(!pts.length){T={cx:45,cy:20.5,s:Math.max(2.5,Math.min(vw/90,vh/42))};}
 else{
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  pts.forEach(p=>{x0=Math.min(x0,p.x-extra);x1=Math.max(x1,p.x+extra);y0=Math.min(y0,p.y-extra);y1=Math.max(y1,p.y+extra);});
  const sx=(x1-x0)||1,sy=(y1-y0)||1;let s=Math.min(vw/sx,vh/sy);
  s=Math.max(2.5,Math.min(s,(pts.length===1&&!extra)?16:140));
  T={cx:(x0+x1)/2,cy:(y0+y1)/2,s};
 }
 go();
}
function refit(){
 if(all)fitTo(allPts());
 else if(sel!=null&&trip.days[sd].items[sel])fitTo([curP()].concat(trip.days[sd].items[sel].alts.map(id=>P[id])),nb.r);
 else fitTo(dayPts(sd));
}

/* ---------- 지도 제스처 ---------- */
const ptrs=new Map();
map.addEventListener('pointerdown',e=>{map.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);cancelAnimationFrame(raf);});
map.addEventListener('pointermove',e=>{
 if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);
 if(ptrs.size===1){V.cx-=(e.clientX-p[0])/V.s;V.cy-=(e.clientY-p[1])/V.s;}
 else if(ptrs.size===2){
  let o=null;ptrs.forEach((v,k)=>{if(k!==e.pointerId)o=v;});
  const d0=Math.hypot(p[0]-o[0],p[1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);
  if(d0>0)V.s=Math.max(2.5,Math.min(160,V.s*d1/d0));
 }
 ptrs.set(e.pointerId,[e.clientX,e.clientY]);T={cx:V.cx,cy:V.cy,s:V.s};drawMap();
});
map.addEventListener('pointerup',e=>ptrs.delete(e.pointerId));
map.addEventListener('pointercancel',e=>ptrs.delete(e.pointerId));
map.addEventListener('wheel',e=>{e.preventDefault();V.s=Math.max(2.5,Math.min(160,V.s*(e.deltaY<0?1.15:.87)));T={cx:V.cx,cy:V.cy,s:V.s};drawMap();},{passive:false});

function pickNb(id){nb.hi=id;renderList();drawMap();const row=list.querySelector('[data-id="'+id+'"]');if(row)row.scrollIntoView({block:'nearest'});}
function pickStop(di,i){
 if(all||di!==sd){all=false;sd=di;sel=i;nb.hi=null;}else sel=sel===i?null:i;
 ahi=null;afterSel();
}
/* 차선책 노드를 누르면 원래 방문지와 함께 보이도록 지도를 옮긴다 */
function pickAlt(i,id){
 all=false;sel=i;ahi=id;nb.hi=null;
 if(sheetH<220)setSheet(snaps()[1],false);
 fitTo([curP(),P[id]],.6);renderAll();
}
function afterSel(){
 if(sel!=null&&sheetH<220)setSheet(snaps()[1],true);else refit();
 renderAll(true);
}

