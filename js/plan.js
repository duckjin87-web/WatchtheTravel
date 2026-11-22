/* ---------- 후보와 순서 정하기 ----------
   후보(trip.pool): 날짜를 정하지 않고 모아 둔 장소.
   지도에서 순서 정하기(ord): 후보 핀을 누르는 순서대로 그 날 일정 끝에 붙인다.
   자동 정리(arrange): 가까운 곳끼리 날짜를 나누고 이동이 짧은 순서로 놓는다. 이동은 직선거리 기준이다. */
let ap=null; /* 자동 정리 입력 칸: {n 날짜 수, h 숙소 id, keep 이미 정한 일정 유지} */
const ordbar=$('#ordbar');

const poolRow=id=>{const p=P[id];
 return '<div class="prow'+(phi===id?' on':'')+'" data-act="pfocus" data-id="'+id+'">'+pinSvg(p.c,22,true)+'<div><div class="nm" style="font-size:14px">'+p.n+'</div><div class="sub">'+[p.c,p.a||''].filter(Boolean).join(' · ')+'</div></div><button class="ib" data-act="pdel" data-id="'+id+'" aria-label="'+p.n+' 후보에서 빼기">'+ic('x')+'</button></div>';};
function poolList(){
 const L=trip.pool;let h='<div class="pool-act"><button class="chip" data-act="auto" aria-expanded="'+!!ap+'"'+(L.length?'':' disabled')+'>'+ic('spark',14)+'자동 정리</button><button class="chip on" data-act="order"'+(L.length?'':' disabled')+'>'+ic('tap',14)+'지도에서 순서 정하기</button></div>';
 if(ap&&L.length)h+=autoPanel();
 if(!L.length)h+='<div class="empty"><p class="nm">후보가 비어 있어요</p><p class="sub">장소 검색에서 "추가 → 후보에 담기"로 가고 싶은 곳을 먼저 모아 두세요.</p></div>';
 h+=L.map(poolRow).join('');
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
 pool=false;all=false;sd=di;sel=null;ahi=null;phi=null;ap=null;ord={di,added:[]};cbox.classList.remove('on');
 if(sheetH>snaps()[1]+10)setSheet(snaps()[1],false);
 fitTo(dayPts(di).concat(trip.pool.map(id=>P[id])));renderAll();
}
function pickPool(id){
 if(!ord){openCand(id);return;}
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

/* ---------- 후보 카드: 눌러서 일정에 넣기 ----------
   날마다 동선이 가장 덜 늘어나는 자리를 찾아, 그 자리와 늘어나는 이동시간(직선거리 추정)을 보여준다 */
const cbox=$('#candbox');
function candSlots(id){
 const p=P[id];
 return trip.days.map((d,i)=>{
  const L=d.items.map(it=>P[it.id]);if(!L.length)return{i,pos:0,add:0,empty:true};
  let pos=L.length,bc=1e9;
  for(let k=0;k<=L.length;k++){const a=L[k-1],b=L[k],c=(a?dist(a,p):0)+(b?dist(p,b):0)-(a&&b?dist(a,b):0);if(c<bc){bc=c;pos=k;}}
  return{i,pos,add:Math.max(1,Math.round(bc*1.35*1.2)),n:L.length};
 });
}
function openCand(id){
 const p=P[id],S=candSlots(id),full=S.filter(s=>!s.empty),best=full.length?full.reduce((a,b)=>b.add<a.add?b:a).i:-1;
 phi=id;
 cbox.innerHTML='<div class="shp cand" role="dialog" aria-label="후보를 일정에 넣기"><div class="nh"><span style="display:flex">'+pinSvg(p.c,24,true)+'</span><div style="flex:1;min-width:0"><b>'+p.n+'</b><div class="sub">'+[p.c,p.a||''].filter(Boolean).join(' · ')+'</div></div><button class="ib" data-cb="x" aria-label="닫기">'+ic('x')+'</button></div>'
  +'<p class="sub" style="margin:0">어느 날에 넣을까요? 동선이 가장 덜 늘어나는 자리에 넣어요.</p><div class="cslots">'
  +S.map(s=>'<button class="cslot'+(s.i===best?' rec':'')+'" data-cb="day" data-i="'+s.i+'" data-pos="'+s.pos+'"><span><i class="dot" style="background:'+COL[s.i%5]+'"></i><b>'+(s.i+1)+'일차</b> '+dlabel(s.i)+(s.i===best?' <em>추천</em>':'')+'</span><span class="sub">'+(s.empty?'비어 있는 날 · 첫 장소로':(s.pos+1)+'번째에 · 이동 +'+dur(s.add))+'</span></button>').join('')
  +'</div><button class="chip big" data-cb="del">'+ic('trash',16)+'후보에서 빼기</button></div>';
 cbox.classList.add('on');renderList();drawMap();
}
/* 지도 빈 곳을 탭하면 카드를 닫는다 (끌어서 움직인 것은 제외) */
/* 지도 빈 곳을 탭: 카드가 열려 있으면 닫고, 아니면 누른 자리 주변 장소를 찾아 카드로 보여준다 (끌어서 움직인 것은 제외) */
let tapL=null,tapSel=null;
function mapTap(pt,rKm){
 if(cbox.classList.contains('on')){closeCand();return;}
 if(!pt||ord||prev||srchOn())return;
 const done=L=>{
  const seen={};L=L.filter(p=>p&&!seen[p.id]&&(seen[p.id]=1)).map(p=>({p,d:dist(pt,p)})).filter(e=>e.d<=rKm*1.5).sort((a,b)=>a.d-b.d).slice(0,5);
  if(!L.length){toast('이 근처에서 장소를 찾지 못했어요. 장소 검색으로 찾아보세요');return;}
  tapL=L.map(e=>e.p.id);tapSel=tapL[0];tapPt=pt;renderTapCard();cbox.classList.add('on');drawMap();
 };
 if(KM)KM.around(pt,rKm,done);else done(DB.filter(p=>dist(pt,p)<=rKm*1.5));
}
let tapPt=null;
function closeCand(){cbox.classList.remove('on');phi=null;tapL=null;tapSel=null;renderList();drawMap();}
/* 일정·후보 어디에 있는지 */
function whereIs(id){
 for(let i=0;i<trip.days.length;i++){const k=trip.days[i].items.findIndex(it=>it.id===id);if(k>-1)return(i+1)+'일차 '+(k+1)+'번째에 있어요';}
 return trip.pool.indexOf(id)>-1?'후보에 있어요':'';
}
function renderTapCard(){
 const p=P[tapSel],S=candSlots(tapSel),full=S.filter(s=>!s.empty),best=full.length?full.reduce((a,b)=>b.add<a.add?b:a).i:-1,w=whereIs(tapSel);
 cbox.innerHTML='<div class="shp cand" role="dialog" aria-label="지도에서 고른 장소"><div class="nh"><b style="flex:1">지도에서 고른 곳 <span class="sub">'+tapL.length+'곳</span></b><button class="ib" data-tb="x" aria-label="닫기">'+ic('x')+'</button></div>'
  +'<div class="trows">'+tapL.map(id=>{const q=P[id],wq=whereIs(id);return '<button class="trow'+(id===tapSel?' on':'')+'" data-tb="sel" data-id="'+id+'">'+pinSvg(q.c,22,true)+'<span><b>'+q.n+'</b><small>'+[q.c,tapPt?fmtD(dist(tapPt,q)):'',q.a||''].filter(Boolean).join(' · ')+'</small></span>'+(wq?'<em>'+(wq.indexOf('후보')===0?'후보':'일정')+'</em>':'')+'</button>';}).join('')+'</div>'
  +'<p class="sub" style="margin:0"><b style="color:var(--ink)">'+p.n+'</b> '+(w?'· '+w:'어디에 넣을까요? 동선이 가장 덜 늘어나는 자리에 넣어요.')+'</p>'
  +'<div class="cslots">'+S.map(s=>'<button class="cslot'+(s.i===best?' rec':'')+'" data-tb="day" data-i="'+s.i+'" data-pos="'+s.pos+'"><span><i class="dot" style="background:'+COL[s.i%5]+'"></i><b>'+(s.i+1)+'일차</b> '+dlabel(s.i)+(s.i===best?' <em>추천</em>':'')+'</span><span class="sub">'+(s.empty?'비어 있는 날 · 첫 장소로':(s.pos+1)+'번째에 · 이동 +'+dur(s.add))+'</span></button>').join('')+'</div>'
  +'<div class="chips" style="margin:0">'+(trip.pool.indexOf(tapSel)<0?'<button class="chip" data-tb="pool">'+ic('pin',14)+'후보에 담기</button>':'')+(KM?'<a class="chip" href="'+kakaoUrl(p)+'" target="_blank" rel="noopener">카카오맵에서 보기</a>':'')+'</div></div>';
}
cbox.addEventListener('click',e=>{
 const b=e.target.closest('[data-tb]');if(!b)return;const a=b.dataset.tb,id=tapSel;
 if(a==='x'){closeCand();return;}
 if(a==='sel'){tapSel=b.dataset.id;renderTapCard();drawMap();return;}
 if(a==='pool'){trip.pool.push(id);closeCand();toast(P[id].n+' 후보에 담았어요',()=>{trip.pool.splice(trip.pool.indexOf(id),1);renderAll();});renderAll();return;}
 if(a==='day'){
  const i=+b.dataset.i,pos=+b.dataset.pos,items=trip.days[i].items,it=item(id),k=trip.pool.indexOf(id);
  if(k>-1)trip.pool.splice(k,1);items.splice(pos,0,it);closeCand();
  toast(P[id].n+' → '+(i+1)+'일차 '+(pos+1)+'번째에 넣었어요',()=>{items.splice(items.indexOf(it),1);if(k>-1)trip.pool.splice(k,0,id);renderAll();});
  renderAll();
 }
});
cbox.addEventListener('click',e=>{
 const b=e.target.closest('[data-cb]');if(!b)return;const a=b.dataset.cb,id=phi;
 if(a==='x'){closeCand();return;}
 if(a==='day'){
  const i=+b.dataset.i,pos=+b.dataset.pos,k=trip.pool.indexOf(id),items=trip.days[i].items;
  trip.pool.splice(k,1);const it=item(id);items.splice(pos,0,it);
  cbox.classList.remove('on');phi=null;
  toast(P[id].n+' → '+(i+1)+'일차 '+(pos+1)+'번째에 넣었어요',()=>{items.splice(items.indexOf(it),1);trip.pool.splice(k,0,id);renderAll();});
  renderAll();return;
 }
 if(a==='del'){const k=trip.pool.indexOf(id);trip.pool.splice(k,1);cbox.classList.remove('on');phi=null;toast(P[id].n+' 후보에서 뺐어요',()=>{trip.pool.splice(k,0,id);renderAll();});renderAll();}
});

/* ---------- 출발지 고르기 ----------
   전날 마지막 장소, 일정·후보의 숙소, 그 밖의 등록된 장소 순으로 보여주고, 다른 곳은 검색해서 정한다 */
let fromAll=false;
function fromChoices(di){
 const out=[],seen=new Set(),add=(id,tag)=>{if(!id||seen.has(id)||!P[id])return;seen.add(id);out.push({id,tag});};
 if(di>0){const pd=trip.days[di-1].items;if(pd.length)add(pd[pd.length-1].id,'전날 마지막');}
 const ids=trip.days.flatMap(d=>d.items.map(it=>it.id)).concat(trip.pool,trip.days.map(d=>d.from).filter(Boolean));
 ids.forEach(id=>{if(P[id]&&P[id].c==='숙소')add(id,'숙소');});
 ids.forEach(id=>add(id,''));
 return out.slice(0,12);
}
function openFrom(di){
 const d=trip.days[di],L=fromChoices(di);
 cbox.innerHTML='<div class="shp cand" role="dialog" aria-label="'+(di+1)+'일차 출발지"><div class="nh"><b style="flex:1">'+(di+1)+'일차 출발지</b><button class="ib" data-fr="x" aria-label="닫기">'+ic('x')+'</button></div>'
  +'<p class="sub" style="margin:0">하루를 시작하는 곳이에요. 정하면 '+d.start+'에 그곳을 떠나 1번 장소까지 가는 시간이 일정에 들어가요.</p>'
  +'<div class="trows"><button class="trow'+(!d.from?' on':'')+'" data-fr="none">'+ic('flag',20)+'<span><b>1번 장소에서 시작</b><small>출발지 없이 지금처럼</small></span></button>'
  +L.map(o=>'<button class="trow'+(d.from===o.id?' on':'')+'" data-fr="set" data-id="'+o.id+'">'+pinSvg(P[o.id].c,22,true)+'<span><b>'+P[o.id].n+'</b><small>'+[o.tag,P[o.id].c].filter(Boolean).join(' · ')+'</small></span></button>').join('')
  +'<button class="trow" data-fr="search">'+ic('search',20)+'<span><b>다른 곳 검색해서 지정</b><small>집, 공항, 숙소 등 등록되지 않은 곳</small></span></button></div>'
  +(trip.days.length>1?'<label class="arow" for="fr-all"><span>모든 날 같은 출발지로</span><input type="checkbox" id="fr-all"'+(fromAll?' checked':'')+'></label>':'')+'</div>';
 cbox.dataset.fd=di;cbox.classList.add('on');
}
function setFrom(di,id,allDays){
 const ds=allDays?trip.days:[trip.days[di]],before=ds.map(d=>d.from);
 ds.forEach(d=>{if(id)d.from=id;else delete d.from;});
 toast(id?(allDays?'모든 날':(di+1)+'일차')+' 출발지를 '+P[id].n+'(으)로 정했어요':(di+1)+'일차는 1번 장소에서 시작해요',()=>{ds.forEach((d,k)=>{if(before[k])d.from=before[k];else delete d.from;});refit();renderAll();});
 fromAll=false;refit();renderAll();
}
cbox.addEventListener('click',e=>{
 const b=e.target.closest('[data-fr]');if(!b)return;const a=b.dataset.fr,di=+cbox.dataset.fd;
 if(a==='x'){closeCand();return;}
 if(a==='none'){closeCand();setFrom(di,null,fromAll);return;}
 if(a==='set'){closeCand();setFrom(di,b.dataset.id,fromAll);return;}
 if(a==='search'){closeCand();openSearch();fromDay=di;renderSearch();}
});
cbox.addEventListener('change',e=>{if(e.target.id==='fr-all')fromAll=e.target.checked;});
