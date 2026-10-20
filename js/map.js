/* ---------- 지도 ---------- */
const map=$('#map'),sheet=$('#sheet'),list=$('#list');
let W=0,H=0,sheetH=420,V={cx:45,cy:20,s:4},T={cx:45,cy:20,s:4},raf=0;
const ISL=[],RING=[];
for(let a=0;a<6.2832;a+=.12){const r=1+.03*Math.sin(3*a+1)+.025*Math.sin(5*a+2);
 ISL.push([45+41*r*Math.cos(a),20.5+18.5*r*Math.sin(a)]);
 RING.push([45+41*.86*Math.cos(a),20.5+18.5*.8*Math.sin(a)]);}
const CROSS=[[6,24],[20,20],[45,19],[70,19],[84,18]];
const size=()=>{W=map.clientWidth;H=map.clientHeight;};
const vb=()=>{const top=64,bot=Math.max(H-sheetH,top+140);return[top,bot];};
const pr=(x,y)=>{const b=vb();return[(x-V.cx)*V.s+W/2,(y-V.cy)*V.s+(b[0]+b[1])/2];};
const path=(pts,closed)=>pts.map((p,i)=>{const q=pr(p[0],p[1]);return(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1);}).join('')+(closed?'Z':'');

function drawMap(){
 size();if(!W||!H)return;
 let o='<rect class="sea" width="'+W+'" height="'+H+'"/>';
 o+='<path class="land" d="'+path(ISL,true)+'"/>';
 const rw=Math.min(8,Math.max(2,V.s*.22));
 o+='<path class="road" stroke-width="'+rw+'" d="'+path(RING,true)+'"/><path class="road" stroke-width="'+rw+'" d="'+path(CROSS,false)+'"/>';
 if(V.s<16){const h=pr(45,20);o+='<path d="M'+(h[0]-8)+' '+(h[1]+5)+'L'+h[0]+' '+(h[1]-7)+'L'+(h[0]+8)+' '+(h[1]+5)+'Z" fill="var(--ink3)" opacity=".5"/><text class="mt" x="'+h[0]+'" y="'+(h[1]+18)+'" text-anchor="middle">한라산</text>';}
 const order=trip.days.map((_,i)=>i).filter(i=>i!==sd).concat([sd]);
 order.forEach(di=>{
  const pts=dayPts(di);if(pts.length<2)return;const c=COL[di%5],on=di===sd;
  const d=path(pts.map(p=>[p.x,p.y]),false);
  o+='<path d="'+d+'" fill="none" stroke="var(--halo)" stroke-width="'+(on?8:6)+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+(on?.9:.5)+'"/>';
  o+='<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+(on?4.5:3)+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+(on?1:.4)+'"/>';
 });
 let sc='';
 if(sel!=null&&trip.days[sd].items[sel]){
  const a=curP(),q=pr(a.x,a.y);
  o+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(nb.r*V.s)+'" fill="var(--ink)" fill-opacity=".05" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 5"/>';
  nearby().forEach(e=>{
   const m=pr(e.p.x,e.p.y),on=nb.hi===e.p.id,f=on?'var(--ink)':'var(--paper)';
   o+='<g data-nid="'+e.p.id+'" style="cursor:pointer">'+(e.p.c==='카페'
    ?'<rect x="'+(m[0]-5)+'" y="'+(m[1]-5)+'" width="10" height="10" rx="2" fill="'+f+'" stroke="var(--ink)" stroke-width="1.5"/>'
    :'<circle cx="'+m[0]+'" cy="'+m[1]+'" r="5.5" fill="'+f+'" stroke="var(--ink)" stroke-width="1.5"/>')
    +'<text class="nl" x="'+(m[0]+9)+'" y="'+(m[1]+4)+'">'+(e.p.r!=null?e.p.r.toFixed(1):'')+'</text></g>';
  });
 }
 order.forEach(di=>{
  const c=COL[di%5],on=di===sd;
  trip.days[di].items.forEach((it,i)=>{
   const p=P[it.id],q=pr(p.x,p.y);
   if(on){
    const open=sel===i;
    if(open)o+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="19" fill="none" stroke="var(--ink)" stroke-width="2"/>';
    o+='<g data-day="'+di+'" data-i="'+i+'" style="cursor:pointer"'+(pg&&i<pg.passed?' opacity=".5"':'')+'><circle cx="'+q[0]+'" cy="'+q[1]+'" r="12" fill="'+c+'" stroke="#fff" stroke-width="2"/><text x="'+q[0]+'" y="'+(q[1]+4)+'" text-anchor="middle" fill="#fff" font-size="12" font-weight="500">'+(i+1)+'</text><text class="pl" x="'+(q[0]+17)+'" y="'+(q[1]+4)+'">'+p.n+'</text></g>';
   }else{
    o+='<g data-day="'+di+'" data-i="'+i+'" style="cursor:pointer"><circle cx="'+q[0]+'" cy="'+q[1]+'" r="6" fill="'+c+'" stroke="#fff" stroke-width="1.5" opacity=".7"/></g>';
   }
  });
 });
 const rows=sched(sd);
 rows.forEach((r,i)=>{
  if(i>=rows.length-1)return;
  const a=pr(r.p.x,r.p.y),b=pr(rows[i+1].p.x,rows[i+1].p.y);
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<56)return;
  const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,t=r.dm+'분',w=t.length*8+14;
  sc+='<g><rect class="chipbg" x="'+(mx-w/2)+'" y="'+(my-10)+'" width="'+w+'" height="20" rx="10" stroke="'+COL[sd%5]+'"/><text class="ct" x="'+mx+'" y="'+(my+4)+'" text-anchor="middle">'+t+'</text></g>';
 });
 if(me){const mq=pr(me.x,me.y);
  if(pg&&pg.d>1.5){const rq=pr(pg.px,pg.py);sc+='<line x1="'+mq[0]+'" y1="'+mq[1]+'" x2="'+rq[0]+'" y2="'+rq[1]+'" stroke="#D6452B" stroke-width="2" stroke-dasharray="4 4"/>';}
  sc+='<circle cx="'+mq[0]+'" cy="'+mq[1]+'" r="20" fill="#2F7FC1" fill-opacity=".15"/><circle cx="'+mq[0]+'" cy="'+mq[1]+'" r="8" fill="#2F7FC1" stroke="#fff" stroke-width="3"/>';}
 map.innerHTML=o+sc;
}
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
 if(sel!=null&&trip.days[sd].items[sel])fitTo([curP()],nb.r);else fitTo(dayPts(sd));
}

/* ---------- 지도 제스처 ---------- */
const ptrs=new Map();let moved=0;
map.addEventListener('pointerdown',e=>{map.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);moved=0;cancelAnimationFrame(raf);});
map.addEventListener('pointermove',e=>{
 if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);
 if(ptrs.size===1){V.cx-=(e.clientX-p[0])/V.s;V.cy-=(e.clientY-p[1])/V.s;moved+=Math.abs(e.clientX-p[0])+Math.abs(e.clientY-p[1]);}
 else if(ptrs.size===2){
  let o=null;ptrs.forEach((v,k)=>{if(k!==e.pointerId)o=v;});
  const d0=Math.hypot(p[0]-o[0],p[1]-o[1]),d1=Math.hypot(e.clientX-o[0],e.clientY-o[1]);
  if(d0>0)V.s=Math.max(2.5,Math.min(160,V.s*d1/d0));moved+=10;
 }
 ptrs.set(e.pointerId,[e.clientX,e.clientY]);T={cx:V.cx,cy:V.cy,s:V.s};drawMap();
});
map.addEventListener('pointerup',e=>{
 ptrs.delete(e.pointerId);
 if(moved>6)return;
 const el=document.elementFromPoint(e.clientX,e.clientY),g=el&&el.closest('[data-i],[data-nid]');
 if(!g)return;
 if(g.dataset.nid){nb.hi=g.dataset.nid;renderList();drawMap();const row=list.querySelector('[data-id="'+nb.hi+'"]');if(row)row.scrollIntoView({block:'nearest'});return;}
 const di=+g.dataset.day,i=+g.dataset.i;
 if(di!==sd){sd=di;sel=i;nb.hi=null;}else sel=sel===i?null:i;
 afterSel();
});
map.addEventListener('pointercancel',e=>ptrs.delete(e.pointerId));
map.addEventListener('wheel',e=>{e.preventDefault();V.s=Math.max(2.5,Math.min(160,V.s*(e.deltaY<0?1.15:.87)));T={cx:V.cx,cy:V.cy,s:V.s};drawMap();},{passive:false});

function afterSel(){
 if(sel!=null&&sheetH<220)setSheet(snaps()[1],true);else refit();
 renderAll(true);
}

