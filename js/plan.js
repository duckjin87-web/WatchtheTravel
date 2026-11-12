/* ---------- 후보와 순서 정하기 ----------
   후보(trip.pool): 날짜를 정하지 않고 모아 둔 장소.
   지도에서 순서 정하기(ord): 후보 핀을 누르는 순서대로 그 날 일정 끝에 붙인다.
   자동 정리(arrange): 가까운 곳끼리 날짜를 나누고 이동이 짧은 순서로 놓는다. 이동은 직선거리 기준이다. */
let ap=null; /* 자동 정리 입력 칸: {n 날짜 수, h 숙소 id, keep 이미 정한 일정 유지} */
const ordbar=$('#ordbar');

function poolList(){
 const L=trip.pool;let h='<div class="pool-act"><button class="chip" data-act="auto" aria-expanded="'+!!ap+'"'+(L.length?'':' disabled')+'>'+ic('spark',14)+'자동 정리</button><button class="chip on" data-act="order"'+(L.length?'':' disabled')+'>'+ic('tap',14)+'지도에서 순서 정하기</button></div>';
 if(ap&&L.length)h+=autoPanel();
 if(!L.length)h+='<div class="empty"><p class="nm">후보가 비어 있어요</p><p class="sub">장소 검색에서 "추가 → 후보에 담기"로 가고 싶은 곳을 먼저 모아 두세요.</p></div>';
 L.forEach(id=>{const p=P[id];
  h+='<div class="prow'+(phi===id?' on':'')+'" data-act="pfocus" data-id="'+id+'">'+pinSvg(p.c,22,true)+'<div><div class="nm" style="font-size:14px">'+p.n+'</div><div class="sub">'+[p.c,p.a||''].filter(Boolean).join(' · ')+'</div></div><button class="ib" data-act="pdel" data-id="'+id+'" aria-label="'+p.n+' 후보에서 빼기">'+ic('x')+'</button></div>';
 });
 if(L.length)h+='<button class="add" data-act="open-search">'+ic('plus',16)+' 후보 더 담기</button>';
 return h;
}
const hotels=()=>{const s=new Set();trip.pool.concat(trip.days.flatMap(d=>d.items.map(it=>it.id))).forEach(id=>{if(P[id].c==='숙소')s.add(id);});return[...s];};
function autoPanel(){
 const H=hotels(),fixed=trip.days.some(d=>d.items.length);
 return '<div class="auto"><div class="arow"><span>며칠에 나눌까요?</span><span class="stay"><button class="ib sm" data-act="apn" data-v="-1" aria-label="하루 줄이기">'+ic('minus',16)+'</button><b>'+ap.n+'일</b><button class="ib sm" data-act="apn" data-v="1" aria-label="하루 늘리기">'+ic('plus',16)+'</button></span></div>'
  +'<label class="arow" for="ap-h"><span>매일 쉬는 숙소</span><select id="ap-h"><option value="">없음</option>'+H.map(id=>'<option value="'+id+'"'+(ap.h===id?' selected':'')+'>'+P[id].n+'</option>').join('')+'</select></label>'
  +(fixed?'<label class="arow" for="ap-keep"><span>이미 정한 일정은 그대로 두기</span><input type="checkbox" id="ap-keep"'+(ap.keep?' checked':'')+'></label>':'')
  +'<p class="sub" style="margin:0">'+(H.length?'숙소를 고르면 날마다 숙소에서 출발해 숙소로 돌아오게 놓아요. ':'후보에 숙소를 담으면 숙소 기준으로 놓을 수 있어요. ')+'직선거리로 계산한 초안이에요.</p>'
  +'<button class="btn-main" data-act="apgo">미리보기</button></div>';
}

/* 순서 정하기 시작: 비어 있는 첫 날, 없으면 보던 날 끝에 붙인다 */
function startOrder(){
 const e=trip.days.findIndex(d=>!d.items.length),di=e>-1?e:(all||pool?0:sd);
 pool=false;all=false;sd=di;sel=null;ahi=null;phi=null;ap=null;ord={di,added:[]};
 if(sheetH>snaps()[1]+10)setSheet(snaps()[1],false);
 fitTo(dayPts(di).concat(trip.pool.map(id=>P[id])));renderAll();
}
function pickPool(id){
 if(!ord){phi=id;renderList();drawMap();const r=list.querySelector('.prow[data-id="'+id+'"]');if(r)r.scrollIntoView({block:'nearest'});return;}
 trip.pool.splice(trip.pool.indexOf(id),1);trip.days[ord.di].items.push(item(id));ord.added.push(id);
 if(!trip.pool.length){ord=null;toast('후보를 모두 일정에 넣었어요');}
 renderAll();
}
function renderOrdbar(){
 $('#app').classList.toggle('ord',!!(ord||prev));
 if(ord)ordbar.innerHTML='<span><b>'+(ord.di+1)+'일차</b> 순서: 지도에서 후보를 차례로 누르세요</span><span class="ob"><button data-o="undo"'+(ord.added.length?'':' disabled')+' aria-label="마지막 것 되돌리기">'+ic('undo',16)+'</button><button data-o="next">'+(ord.di<trip.days.length-1?(ord.di+2)+'일차로':'날짜 추가')+'</button><button data-o="done">완료</button></span>';
 else if(prev){
  const m=trip.days.reduce((a,_,i)=>a+sched(i).reduce((s,r)=>s+r.dm,0),0);
  ordbar.innerHTML='<span><b>자동 정리 미리보기</b> · 이동 '+dur(m)+'</span><span class="ob"><button data-o="cancel">취소</button><button data-o="apply" class="pri">이대로 적용</button></span>';
 }else ordbar.innerHTML='';
}
ordbar.addEventListener('click',e=>{
 const b=e.target.closest('[data-o]');if(!b)return;const o=b.dataset.o;
 if(o==='undo'){const id=ord.added.pop(),items=trip.days[ord.di].items;for(let k=items.length-1;k>=0;k--)if(items[k].id===id){items.splice(k,1);break;}trip.pool.push(id);renderAll();return;}
 if(o==='next'){
  if(ord.di>=trip.days.length-1)trip.days.push({start:'09:00',items:[]});
  ord={di:ord.di+1,added:[]};sd=ord.di;sel=null;fitTo(dayPts(sd).concat(trip.pool.map(id=>P[id])));renderAll();return;
 }
 if(o==='done'){ord=null;refit();renderAll();return;}
 if(o==='cancel'){trip.days=prev.days;trip.pool=prev.pool;prev=null;pool=true;all=false;refit();renderAll();return;}
 if(o==='apply'){const bk=prev;prev=null;ap=null;renderAll();toast('자동 정리를 적용했어요',()=>{trip.days=bk.days;trip.pool=bk.pool;pool=true;all=false;refit();renderAll();});}
});

/* ---------- 자동 정리 ---------- */
const mean=L=>({x:L.reduce((a,p)=>a+p.x,0)/L.length,y:L.reduce((a,p)=>a+p.y,0)/L.length});
const pathCost=(L,H)=>{let c=0;for(let i=1;i<L.length;i++)c+=dist(L[i-1],L[i]);if(H&&L.length)c+=dist(H,L[0])+dist(L[L.length-1],H);return c;};
/* 가장 가까운 곳부터 잇고, 2-opt로 꼬인 구간을 푼다 */
function orderRoute(its,H){
 if(its.length<2)return its;
 const rest=its.slice(),out=[];let cur=H||rest.reduce((a,b)=>P[b.id].x<P[a.id].x?b:a);
 if(!H){out.push(cur);rest.splice(rest.indexOf(cur),1);cur=P[cur.id];}
 while(rest.length){let k=0,bd=1e9;rest.forEach((it,j)=>{const d=dist(cur,P[it.id]);if(d<bd){bd=d;k=j;}});const it=rest.splice(k,1)[0];out.push(it);cur=P[it.id];}
 let better=true,guard=0;
 while(better&&guard++<50){
  better=false;
  for(let i=0;i<out.length-1;i++)for(let j=i+1;j<out.length;j++){
   const t=out.slice(0,i).concat(out.slice(i,j+1).reverse(),out.slice(j+1));
   if(pathCost(t.map(x=>P[x.id]),H)+1e-9<pathCost(out.map(x=>P[x.id]),H)){out.splice(0,out.length,...t);better=true;}
  }
 }
 return out;
}
function insertCheapest(items,x,H){
 let bi=items.length,bc=1e18;
 for(let k=0;k<=items.length;k++){const t=items.slice(0,k).concat([x],items.slice(k)),c=pathCost(t.map(it=>P[it.id]),H);if(c<bc){bc=c;bi=k;}}
 items.splice(bi,0,x);
}
function split(days,fixed,free,pts,n,H,s0){
 /* 중심: 일정이 있는 날은 그 날 장소들의 가운데, 빈 날은 s0번 후보에서 시작해 이미 정한 중심들에서 가장 먼 후보 */
 let C=fixed.map(f=>f.length?mean(f):null);
 C.forEach((c,i)=>{
  if(c)return;let best=null,bd=-1;
  if(s0>-1&&!C.some((q,j)=>q&&!fixed[j].length))best=pts[s0];
  else pts.forEach(p=>{const known=C.filter(Boolean),d=known.length?Math.min(...known.map(q=>dist(q,p))):(H?dist(H,p):-p.x);if(d>bd){bd=d;best=p;}});
  C[i]=best?{x:best.x,y:best.y}:(H||{x:0,y:0});
 });
 /* 하루에 너무 몰리지 않게 날마다 칸 수를 두고, 가까운 날에 배정하기를 몇 번 반복한다 */
 const total=pts.length+fixed.reduce((a,f)=>a+f.length,0),cap=i=>Math.max(1,Math.ceil(total/n)+1-fixed[i].length);
 let asg=[];
 for(let r=0;r<8;r++){
  const cnt=new Array(n).fill(0);
  const seq=pts.map((p,k)=>{const ds=C.map(c=>dist(c,p)).sort((a,b)=>a-b);return{k,gap:(ds.length>1?ds[1]:ds[0])-ds[0]};}).sort((a,b)=>b.gap-a.gap);
  asg=new Array(pts.length);
  seq.forEach(({k})=>{const by=C.map((c,i)=>({i,d:dist(c,pts[k])})).sort((a,b)=>a.d-b.d),ch=by.find(o=>cnt[o.i]<cap(o.i))||by[0];asg[k]=ch.i;cnt[ch.i]++;});
  C=C.map((c,i)=>{const m=fixed[i].concat(pts.filter((_,k)=>asg[k]===i));return m.length?mean(m):c;});
 }
 let cost=0;
 const orders=days.map((d,i)=>{
  const add=free.filter((_,k)=>asg[k]===i);let o;
  if(d.items.length){o=d.items.slice();add.forEach(x=>insertCheapest(o,x,H));}else o=orderRoute(add,H);
  cost+=pathCost(o.map(it=>P[it.id]),H);return o;
 });
 return{cost,orders};
}
function arrange(n,hid,keep){
 const D=trip.days;while(D.length<n)D.push({start:'09:00',items:[]});
 const H=hid?P[hid]:null,days=D.slice(0,n);
 let free=trip.pool.filter(id=>id!==hid).map(item);
 D.forEach(d=>{d.items=d.items.filter(it=>it.id!==hid);});
 if(!keep)days.forEach(d=>{free=free.concat(d.items);d.items=[];});
 trip.pool=[];
 const fixed=days.map(d=>d.items.map(it=>P[it.id])),pts=free.map(it=>P[it.id]);
 /* 빈 날의 첫 중심을 후보마다 바꿔 가며 나눠 보고, 이동 합이 가장 짧은 결과를 쓴다 */
 const tries=fixed.some(f=>!f.length)&&pts.length?pts.map((_,k)=>k):[-1];
 let best=null;
 tries.forEach(s0=>{const r=split(days,fixed,free,pts,n,H,s0);if(!best||r.cost<best.cost)best=r;});
 days.forEach((d,i)=>{d.items=best.orders[i];});
 if(H)days.forEach((d,i)=>{if(i>0)d.items.unshift(item(hid));if(i<n-1)d.items.push(item(hid));});
}
function runAuto(){
 prev={days:JSON.parse(JSON.stringify(trip.days)),pool:trip.pool.slice()};
 arrange(ap.n,ap.h,ap.keep);
 pool=false;all=true;sel=null;phi=null;
 if(sheetH>snaps()[1]+10)setSheet(snaps()[1],false);
 refit();renderAll();
}
