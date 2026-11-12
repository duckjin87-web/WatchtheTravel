const toMin=s=>{const a=s.split(':');return +a[0]*60+ +a[1];};
const hm=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const dur=m=>{const h=Math.floor(m/60),mm=m%60;return h&&mm?h+'시간 '+mm+'분':h?h+'시간':mm+'분';};
/* 위경도 <-> km 평면 좌표(x 동쪽, y 남쪽). 카카오 모드에서 기준점을 일정 중심으로 맞춘다 */
const GEO={lat:33.57,lng:126.15,kx:92.9};
const proj=(lat,lng)=>({x:(lng-GEO.lng)*GEO.kx,y:(GEO.lat-lat)*110.95});
const unproj=(x,y)=>({lat:GEO.lat-y/110.95,lng:GEO.lng+x/GEO.kx});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const plen=L=>{let s=0;for(let i=1;i<L.length;i++)s+=dist(L[i-1],L[i]);return s;};
function along(L,f){
 const g=plen(L)*f;let s=0;
 for(let i=1;i<L.length;i++){const d=dist(L[i-1],L[i]);if(s+d>=g){const t=d?(g-s)/d:0;return{x:L[i-1].x+(L[i].x-L[i-1].x)*t,y:L[i-1].y+(L[i].y-L[i-1].y)*t};}s+=d;}
 return L[L.length-1];
}
const fmtD=d=>d<1?(Math.round(d*100)*10)+'m':d.toFixed(1)+'km';
const dlabel=i=>{const d=new Date(trip.start+'T00:00:00');d.setDate(d.getDate()+i);return (d.getMonth()+1)+'/'+d.getDate()+'('+'일월화수목금토'[d.getDay()]+')';};

/* 분류: 카카오 category_group_code 우선, 없으면 분류 이름(예: "음식점 > 카페")으로 추정 */
const CATS=['명소','음식점','카페','숙소'],CIC={'명소':'spot','음식점':'food','카페':'cafe','숙소':'bed'};
const cic=(c,s)=>ic(CIC[c]||'spot',s);
/* 지도 표시: 분류마다 모양과 색이 다르다 (명소 원, 음식점 둥근 사각형, 카페 마름모, 숙소 집 모양).
   일차는 경로선 색과 마커의 번호 배지 색으로 구분한다 */
const CCOL={'명소':'#2563EB','음식점':'#E11D48','카페':'#9A5B2B','숙소':'#0F766E'};
const SHAPE={'명소':'<circle cx="15" cy="15" r="12.5"/>','음식점':'<rect x="3" y="3" width="24" height="24" rx="6"/>','카페':'<path d="M15 1.5L28.5 15L15 28.5L1.5 15Z"/>','숙소':'<path d="M15 2L28.5 13.5V28H1.5V13.5Z"/>'};
/* solid: 분류색으로 채움(일정 방문지) / 아니면 흰 바탕에 분류색 선(근처 장소) */
function pinSvg(c,size,solid){
 c=CCOL[c]?c:'명소';const col=CCOL[c],fg=solid?'#fff':col;
 return '<svg class="pin" width="'+size+'" height="'+size+'" viewBox="0 0 30 30" aria-hidden="true"><g fill="'+(solid?col:'#fff')+'" stroke="'+(solid?'#fff':col)+'" stroke-width="2.2" stroke-linejoin="round">'+SHAPE[c]+'</g>'
  +'<svg x="8" y="8" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+fg+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-'+CIC[c]+'"/></svg></svg>';
}
function catOf(code,name){
 if(code==='AD5')return'숙소';if(code==='CE7')return'카페';if(code==='FD6')return'음식점';
 name=name||'';
 if(/숙박|호텔|펜션|리조트|게스트|모텔|민박|스테이|콘도/.test(name))return'숙소';
 if(/카페|커피|디저트|베이커리|제과/.test(name))return'카페';
 if(/음식점|식당|맛집|국수|횟집|고기|분식/.test(name))return'음식점';
 return'명소';
}

/* 구간: 자동차는 길찾기 결과(route.js), 없으면 직선거리 x1.35를 시속 50km로 추정. 도보는 직선거리 x1.25를 시속 4.5km로 추정 */
function seg(a,b,mode){
 const d=dist(a,b);
 if(mode==='walk'){const km=d*1.25;return{walk:true,est:true,km,min:Math.max(1,Math.round(km/4.5*60)),path:[a,b]};}
 return route(a,b)||{est:true,km:d*1.35,min:Math.max(3,Math.round(d*1.35*1.2)),path:[a,b]};
}
function sched(di){
 const d=trip.days[di];let t=toMin(d.start);const rows=[];
 d.items.forEach((it,i)=>{
  const p=P[it.id],arr=t,dep=arr+it.stay,nx=d.items[i+1],s=nx?seg(p,P[nx.id],it.mode):null;
  rows.push({it,p,arr,dep,s,dm:s?s.min:0,km:s?s.km:0});t=dep+(s?s.min:0);
 });
 return rows;
}
const dayPts=di=>trip.days[di].items.map(it=>P[it.id]);
const allPts=()=>trip.days.flatMap((_,i)=>dayPts(i));
const curP=()=>P[trip.days[sd].items[sel].id];
function nearby(){
 if(all||sel==null||!trip.days[sd].items[sel])return[];
 const a=curP();
 return (KM?KM.near(a).list:DB).filter(p=>p.c!=='명소'&&p.id!==a.id&&dist(a,p)<=nb.r&&(nb.t==='전체'||p.c===nb.t)&&(nb.s==='전체'||p.src.indexOf(nb.s)>-1)&&(p.r==null?nb.min===0:p.r>=nb.min))
  .map(p=>({p,d:dist(a,p)})).sort((x,y)=>x.d-y.d);
}

/* 지도에 그릴 내용. 도식 지도(map.js)와 카카오맵(kakao.js)이 같이 쓴다.
   lines: {pts,c,w,op,halo,dash,z} / marks: {p,h(HTML),z,click,need:[a,b] 화면에서 56px 이상 떨어질 때만} / circle: {p,r(km)} */
function scene(){
 const lines=[],marks=[];let circle=null;
 const dv=!all&&!pool,order=trip.days.map((_,i)=>i).filter(i=>!dv||i!==sd);if(dv)order.push(sd);
 order.forEach(di=>{
  const on=all||(dv&&di===sd),c=COL[di%5];
  sched(di).forEach(r=>{
   if(!r.s)return;
   lines.push({pts:r.s.path,c,w:on?4.5:3,op:on?1:.4,halo:true,z:on?2:1});
   if(r.s.walk&&on)[.25,.75].forEach(f=>marks.push({p:along(r.s.path,f),z:3,h:'<div class="kshoe" style="color:'+c+'">'+ic('shoe',13)+'</div>'}));
  });
 });
 if(dv&&sel!=null&&trip.days[sd].items[sel]){
  circle={p:curP(),r:nb.r};
  nearby().forEach(e=>marks.push({p:e.p,z:3,h:'<div class="kn'+(nb.hi===e.p.id?' on':'')+'" title="'+e.p.n+'">'+pinSvg(e.p.c,24,nb.hi===e.p.id)+'</div>',click:()=>pickNb(e.p.id)}));
 }
 if(dv){
  const c=COL[sd%5];
  trip.days[sd].items.forEach((it,i)=>(it.alts||[]).forEach(id=>{
   const a=P[it.id],b=P[id];
   lines.push({pts:[a,b],c,w:2,op:.9,dash:true,z:3});
   marks.push({p:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},z:4,need:[a,b],h:'<div class="kc alt">'+fmtD(dist(a,b))+'</div>'});
   marks.push({p:b,z:4,h:'<div class="kalt'+(ahi===id?' on':'')+'" style="border-color:'+c+'">'+pinSvg(b.c,18,true)+'<b>'+b.n+'</b></div>',click:()=>pickAlt(i,id)});
  }));
 }
 order.forEach(di=>{
  const c=COL[di%5],on=all||(dv&&di===sd);
  trip.days[di].items.forEach((it,i)=>{
   const p=P[it.id];
   if(on)marks.push({p,z:5,h:'<div class="ks'+(!all&&sel===i?' open':'')+(!all&&pg&&i<pg.passed?' done':'')+'">'+pinSvg(p.c,30,true)+'<span class="no" style="background:'+c+'">'+(i+1)+'</span><b>'+p.n+'</b></div>',click:()=>pickStop(di,i)});
   else marks.push({p,z:2,h:'<div class="kd">'+pinSvg(p.c,18,true)+'</div>',click:()=>pickStop(di,i)});
  });
 });
 if(pool||ord)trip.pool.forEach(id=>{const p=P[id];marks.push({p,z:6,h:'<div class="kp'+(phi===id?' on':'')+'">'+pinSvg(p.c,26,true)+'<b>'+p.n+'</b></div>',click:()=>pickPool(id)});});
 if(dv){
  const rows=sched(sd);
  rows.forEach((r,i)=>{if(r.s)marks.push({p:along(r.s.path,.5),z:4,need:[r.p,rows[i+1].p],h:'<div class="kc" style="border-color:'+COL[sd%5]+'">'+(r.s.walk?ic('shoe',12):'')+r.s.min+'분</div>'});});
 }
 if(me){
  if(pg&&pg.d>1.5)lines.push({pts:[me,{x:pg.px,y:pg.py}],c:'#D6452B',w:2,op:1,dash:true,z:6});
  marks.push({p:me,z:7,h:'<div class="kme"></div>'});
 }
 return{lines,marks,circle};
}
