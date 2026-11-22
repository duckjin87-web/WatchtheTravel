/* ---------- 목록 ---------- */
const sumOf=rows=>{const L=rows.lead;return{mins:rows.reduce((a,r)=>a+r.dm,0)+(L?L.dm:0),km:rows.reduce((a,r)=>a+r.km,0)+(L?L.km:0)};};
function renderTabs(){
 $('#tabs').innerHTML='<button class="tab" role="tab" aria-selected="'+all+'" data-day="all">전체</button>'
  +'<button class="tab" role="tab" aria-selected="'+pool+'" data-day="pool">'+ic('pin',14)+'후보 <span class="sub">'+trip.pool.length+'</span></button>'
  +trip.days.map((d,i)=>'<button class="tab" role="tab" aria-selected="'+(!all&&!pool&&i===sd)+'" data-day="'+i+'"><i class="dot" style="background:'+COL[i%5]+'"></i>'+(i+1)+'일차 <span class="sub">'+dlabel(i)+'</span></button>').join('')
  +'<button class="tab" data-act="newday" aria-label="날짜 추가">'+ic('plus',16)+'</button>';
 if(pool){$('#sum').innerHTML='<span>후보 '+trip.pool.length+'곳 · 날짜를 정하지 않고 모아 둔 장소</span>';return;}
 if(all){
  const R=trip.days.map((_,i)=>sched(i)),S=R.map(sumOf).reduce((a,x)=>({mins:a.mins+x.mins,km:a.km+x.km}),{mins:0,km:0});
  $('#sum').innerHTML='<span>'+trip.days.length+'일 · '+R.reduce((a,r)=>a+r.length,0)+'곳 · 이동 '+dur(S.mins)+' · '+fmtD(S.km)+'</span>';
  return;
 }
 const rows=sched(sd),d=trip.days[sd],S=sumOf(rows);
 const nd=rows.filter(r=>r.dn).length;
 $('#sum').innerHTML='<span>'+rows.length+'곳'+(nd?' · 완료 '+nd:'')+' · 이동 '+dur(S.mins)+' · '+fmtD(S.km)+'</span><span style="display:flex;gap:8px;align-items:center">'+(trip.days.length>1?'<button class="chip" data-act="delday">'+(dpend===sd?(d.items.length?d.items.length+'곳 함께 삭제 · 한 번 더':'한 번 더 누르면 삭제'):'날짜 삭제')+'</button>':'')+'<label>시작 <input type="time" id="stime" aria-label="'+(sd+1)+'일차 시작 시각" value="'+d.start+'"></label></span>';
}
/* 이동 줄: 일차 화면에서는 자동차/도보를 바로 바꿀 수 있다 */
function driveRow(r,i,edit){
 const s=r.s,w=!!s.walk;
 return '<div class="drive">'+(edit
   ?'<span class="seg" role="group" aria-label="이동 수단"><button data-act="mode" data-i="'+i+'" data-v="car" aria-pressed="'+!w+'">'+ic('car',14)+'차</button><button data-act="mode" data-i="'+i+'" data-v="walk" aria-pressed="'+w+'">'+ic('shoe',14)+'도보</button></span>'
   :ic(w?'shoe':'car',16))
  +'<span>'+hm(r.dep)+' 출발 · '+(w?'도보 ':'차로 ')+dur(r.dm)+' · '+fmtD(s.km)+' · '+hm(r.dep+r.dm)+' 도착'+(KM&&s.est&&!w?' · 직선 추정':'')+'</span></div>';
}
const nameRow=p=>'<div class="nm"><span class="ci" style="color:'+(CCOL[p.c]||'inherit')+'">'+cic(p.c,16)+'</span>'+p.n+'</div>';
function renderList(){
 const st=list.scrollTop;let h='';
 if(pool)h=poolList();
 else if(all)h=allList();
 else{
  const rows=sched(sd),c=COL[sd%5];
  h+=fromRow(sd,rows,true);
  if(!rows.length)h+='<div class="empty"><p class="nm">'+(sd+1)+'일차 일정이 비어 있어요</p><p class="sub">방문지를 추가하면 이동 시간이 자동으로 계산돼요.</p></div>';
  rows.forEach((r,i)=>{
   const last=i===rows.length-1,open=sel===i,alts=r.it.alts;
   h+='<div class="stop'+(r.dn||pg&&i<pg.passed?' done':'')+'"><div class="rail"><span class="num" style="background:'+c+'">'+(i+1)+'</span>'+(last?'':'<span class="line" style="background:'+c+'"></span>')+'</div><div class="main">'
    +'<div class="card'+(open?' open':'')+'"><button class="cm" data-act="sel" data-i="'+i+'" aria-expanded="'+open+'">'+nameRow(r.p)+'<div class="tm">'+hm(r.arr)+'–'+hm(r.dep)+'</div></button>'
    +'<div class="ed"><button class="ck'+(r.dn?' on':'')+'" data-act="done" data-i="'+i+'" aria-pressed="'+r.dn+'">'+ic('check',14)+(r.dn?'완료':'방문 완료')+'</button>'
    +(r.dn?'<label class="ckt">출발 <input type="time" class="ckin" data-i="'+i+'" value="'+hm(r.it.done)+'" aria-label="'+r.p.n+' 실제 출발 시각"></label>'
     :'<span class="stay"><button class="ib sm" data-act="stay" data-i="'+i+'" data-v="-30" aria-label="머무는 시간 30분 줄이기">'+ic('minus',16)+'</button><span class="sub">'+dur(r.it.stay)+'</span><button class="ib sm" data-act="stay" data-i="'+i+'" data-v="30" aria-label="머무는 시간 30분 늘리기">'+ic('plus',16)+'</button></span>')
    +'<button class="ib sm" data-act="del" data-i="'+i+'" aria-label="'+r.p.n+' 삭제">'+ic('trash',16)+'</button><button class="ib sm grip" data-drag="'+i+'" aria-label="끌어서 순서 바꾸기">'+ic('grip',16)+'</button></div></div>';
   if(alts.length)h+='<div class="alts">'+ic('alt',14)+alts.map(id=>{const q=P[id];return '<button class="achip'+(ahi===id?' on':'')+'" data-act="altgo" data-i="'+i+'" data-id="'+id+'">'+cic(q.c,12)+q.n+' · '+fmtD(dist(r.p,q))+'</button>';}).join('')+'</div>';
   if(open)h+=detail(i,r);
   if(!last)h+=driveRow(r,i,true);
   h+='</div></div>';
  });
  h+='<button class="add" data-act="open-search">'+ic('plus',16)+' 방문지 추가</button>';
 }
 list.innerHTML=h;list.scrollTop=st;
}
/* 출발지 줄: 정했으면 "출발 · 장소 · 09:00 출발"과 1번까지 이동(차/도보), 안 정했으면 지정 버튼 */
function fromRow(di,rows,edit){
 const L=rows.lead,c=COL[di%5];
 if(!L)return edit?'<button class="fromadd" data-act="from">'+ic('flag',16)+'출발지 지정 <span class="sub">지금은 1번 장소에서 시작해요</span></button>':'';
 const w=L.s&&L.s.walk;
 return '<div class="stop from"><div class="rail"><span class="num fl" style="background:'+c+'">'+ic('flag',13)+'</span>'+(rows.length?'<span class="line" style="background:'+c+'"></span>':'')+'</div><div class="main">'
  +'<div class="card fcard">'+(edit?'<button class="cm" data-act="from">':'<div class="cm">')+'<div class="nm"><span class="ci" style="color:'+(CCOL[L.p.c]||'inherit')+'">'+cic(L.p.c,16)+'</span><span class="sub" style="margin-right:4px">출발</span>'+L.p.n+'</div><div class="tm">'+hm(L.dep)+' 출발</div>'+(edit?'</button>':'</div>')+'</div>'
  +(L.s?'<div class="drive">'+(edit?'<span class="seg" role="group" aria-label="출발지에서 이동 수단"><button data-act="fmode" data-v="car" aria-pressed="'+!w+'">'+ic('car',14)+'차</button><button data-act="fmode" data-v="walk" aria-pressed="'+!!w+'">'+ic('shoe',14)+'도보</button></span>':ic(w?'shoe':'car',16))
   +'<span>'+hm(L.dep)+' 출발 · '+(w?'도보 ':'차로 ')+dur(L.dm)+' · '+fmtD(L.km)+' · '+hm(L.dep+L.dm)+' 1번 도착'+(KM&&L.s.est&&!w?' · 직선 추정':'')+'</span></div>':'')
  +'</div></div>';
}
/* 전체 탭: 날짜별로 이어서 보여주고, 누르면 그 날 그 방문지로 이동한다 */
function allList(){
 let h='';
 trip.days.forEach((d,di)=>{
  const rows=sched(di),c=COL[di%5],S=sumOf(rows);
  h+='<button class="dtitle" data-act="day" data-day="'+di+'"><i class="dot" style="background:'+c+'"></i>'+(di+1)+'일차 '+dlabel(di)+'<span class="sub">'+d.start+' 시작 · '+rows.length+'곳 · 이동 '+dur(S.mins)+'</span></button>';
  h+=fromRow(di,rows,false);
  if(!rows.length)h+='<p class="sub" style="margin:0 0 8px 32px">일정이 비어 있어요</p>';
  rows.forEach((r,i)=>{
   const last=i===rows.length-1;
   h+='<div class="stop'+(r.dn?' done':'')+'"><div class="rail"><span class="num" style="background:'+c+'">'+(i+1)+'</span>'+(last?'':'<span class="line" style="background:'+c+'"></span>')+'</div><div class="main">'
    +'<button class="card cm" data-act="go" data-day="'+di+'" data-i="'+i+'">'+nameRow(r.p)+'<div class="tm">'+hm(r.arr)+'–'+hm(r.dep)+'</div></button>'
    +(r.it.alts.length?'<div class="alts">'+ic('alt',14)+'<span class="sub">차선책 '+r.it.alts.length+'곳</span></div>':'')
    +(last?'':driveRow(r,i,false))+'</div></div>';
  });
 });
 if(trip.pool.length)h+='<div class="dtitle dsec">'+ic('pin',16)+'후보 '+trip.pool.length+'곳<span class="sub">누르면 날짜를 골라 넣어요</span></div>'+trip.pool.map(poolRow).join('');
 return h;
}
function chip(act,v,label,on){return '<button class="chip" data-act="'+act+'" data-v="'+v+'" aria-pressed="'+on+'">'+label+'</button>';}
function detail(i,r){
 const n=trip.days.length,L=nearby(),alts=r.it.alts;
 let h='<div class="detail"><div class="chips" style="margin-top:0">';
 if(sd>0)h+='<button class="chip" data-act="prevday">'+ic('left',16)+'전날로</button>';
 if(sd<n-1)h+='<button class="chip" data-act="nextday">다음날로'+ic('right',16)+'</button>';
 if(KM)h+='<a class="chip" href="'+kakaoUrl(r.p)+'" target="_blank" rel="noopener">카카오맵에서 보기</a>';
 h+='</div><div class="chips" role="group" aria-label="분류">'+CATS.map(c=>'<button class="chip" data-act="cat" data-v="'+c+'" aria-pressed="'+(r.p.c===c)+'">'+cic(c,14)+c+'</button>').join('')+'</div>';
 if(alts.length){
  h+='<div class="nbh"><span class="nm" style="font-size:14px">차선책</span><span class="sub">지도에 점선으로 연결돼요</span></div>';
  alts.forEach(id=>{const q=P[id];
   h+='<div class="nb'+(ahi===id?' on':'')+'" data-act="altgo" data-i="'+i+'" data-id="'+id+'"><div>'+nameRow(q).replace('class="nm"','class="nm" style="font-size:14px"')+'<div class="sub">'+q.c+' · '+r.p.n+'에서 '+fmtD(dist(r.p,q))+'</div></div><span class="nbb"><button class="chip" data-act="swap" data-id="'+id+'">'+ic('swap',14)+'교체</button><button class="ib" data-act="altdel" data-id="'+id+'" aria-label="'+q.n+' 차선책에서 빼기">'+ic('x')+'</button></span></div>';
  });
 }
 h+='<div class="nbh"><span class="nm" style="font-size:14px">근처 음식점·카페·숙소</span><span class="sub">'+L.length+'곳</span></div>';
 h+='<div class="chips">'+[1,3,5,10].map(v=>chip('r',v,v+'km',nb.r===v)).join('')+'</div>';
 h+='<div class="chips">'+['전체','음식점','카페','숙소'].map(v=>chip('t',v,v==='전체'?v:cic(v,14)+v,nb.t===v)).join('')+'</div>';
 if(!KM)h+='<div class="chips">'+[['전체','출처 전체'],['카카오','카카오'],['네이버','네이버']].map(a=>chip('s',a[0],a[1],nb.s===a[0])).join('')+'</div>';
 if(!KM)h+='<div class="chips">'+[[0,'평점 전체'],[3.5,'3.5+'],[4,'4.0+'],[4.3,'4.3+']].map(a=>chip('m',a[0],a[1],nb.min===a[0])).join('')+'</div>';
 h+='<div style="margin-top:8px">';
 const ks=KM&&KM.near(curP());
 if(ks&&ks.busy)h+='<p class="sub" style="margin:10px 0 0">근처 장소를 불러오는 중이에요…</p>';
 else if(ks&&ks.err)h+='<p class="sub" style="margin:10px 0 0">카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>';
 else if(!L.length)h+='<p class="sub" style="margin:10px 0 0">이 조건에 맞는 곳이 없어요. 반경을 넓히'+(KM?'거나 종류를 바꿔':'거나 평점 조건을 낮춰')+' 보세요.</p>';
 L.slice(0,8).forEach(e=>{
  const isAlt=alts.indexOf(e.p.id)>-1;
  h+='<div class="nb'+(nb.hi===e.p.id?' on':'')+'" data-act="hi" data-id="'+e.p.id+'"><div>'+nameRow(e.p).replace('class="nm"','class="nm" style="font-size:14px"')+'<div class="sub">'+(e.p.r!=null?'<span class="star">★</span> '+e.p.r.toFixed(1)+' ('+e.p.v+')':'평점 없음')+' · '+fmtD(e.d)+' · '+e.p.src+'</div></div>'
   +'<span class="nbb"><button class="chip" data-act="alt" data-id="'+e.p.id+'" aria-pressed="'+isAlt+'" aria-label="'+e.p.n+' 차선책으로 연결">'+ic('alt',14)+'차선책</button><button class="ib" data-act="addnb" data-id="'+e.p.id+'" aria-label="'+e.p.n+' 일정에 추가">'+ic('plus')+'</button></span></div>';
 });
 if(L.length>8)h+='<p class="sub" style="margin:6px 0 0">가까운 순으로 8곳만 보여줘요.</p>';
 h+='</div><p class="foot">'+(KM?'카카오 로컬 검색 결과예요. 카카오 API는 평점을 주지 않아서 평점은 아직 표시하지 않아요.':'예시 데이터예요. 카카오와 네이버 검색 결과를 합쳐 보여주고, 같은 장소는 하나로 묶어요. 네이버 검색 API는 평점을 주지 않아서 평점은 카카오 장소 상세 값만 표시해요.')+'</p></div>';
 return h;
}
function renderAll(){renderTabs();pg=prog();renderG();renderList();drawMap();renderOrdbar();renderShnote();renderHead();saveTrip();}

function toast(t,undo){
 const el=$('#toast');el.textContent=t;
 if(undo){const b=document.createElement('button');b.textContent='되돌리기';b.onclick=()=>{el.classList.remove('on');undo();};el.append(b);}
 el.classList.toggle('act',!!undo);el.classList.add('on');
 clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),undo?4000:1800);
}

list.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const a=b.dataset.act,v=b.dataset.v,items=trip.days[sd].items,i=b.dataset.i!=null?+b.dataset.i:sel,it=items[i];
 if(a==='sel'){sel=sel===i?null:i;nb.hi=null;ahi=null;afterSel();return;}
 if(a==='go'){pickStop(+b.dataset.day,i);return;}
 if(a==='day'){all=false;sd=+b.dataset.day;sel=null;ahi=null;refit();renderAll();return;}
 if(a==='open-search'){openSearch();return;}
 if(a==='from'){openFrom(sd);return;}
 if(a==='fmode'){trip.days[sd].fmode=v;renderAll();const L=sched(sd).lead;if(v==='walk'&&L&&L.km>3)toast('걷기에는 먼 거리예요 (도보 '+dur(L.dm)+')');return;}
 if(a==='order'){startOrder();return;}
 if(a==='auto'){ap=ap?null:{n:Math.max(1,trip.days.length),h:hotels()[0]||'',keep:true};renderList();return;}
 if(a==='apn'){ap.n=Math.max(1,Math.min(14,ap.n+ +v));renderList();return;}
 if(a==='apgo'){runAuto();return;}
 if(a==='pfocus'){fitTo([P[b.dataset.id]],.8);openCand(b.dataset.id);return;}
 if(a==='pdel'){const id=b.dataset.id,k=trip.pool.indexOf(id);trip.pool.splice(k,1);if(phi===id)phi=null;toast(P[id].n+' 후보에서 뺐어요',()=>{trip.pool.splice(k,0,id);renderAll();});renderAll();return;}
 if(a==='stay'){it.stay=Math.max(30,Math.min(720,it.stay+ +v));renderAll();return;}
 if(a==='done'){
  if(typeof it.done==='number'){const was=it.done;delete it.done;toast('방문 완료를 취소했어요',()=>{it.done=was;renderAll();});renderAll();return;}
  const n=new Date();it.done=n.getHours()*60+n.getMinutes();
  toast(P[it.id].n+' '+hm(it.done)+' 출발로 바꿨어요 · 다음 일정 시간도 맞췄어요',()=>{delete it.done;renderAll();});renderAll();return;
 }
 if(a==='mode'){it.mode=v;renderAll();const r=sched(sd)[i];if(v==='walk'&&r.s&&r.s.km>3)toast('걷기에는 먼 거리예요 (도보 '+dur(r.dm)+')');return;}
 if(a==='del'){
  items.splice(i,1);const was=sel;sel=sel===i?null:(sel>i?sel-1:sel);
  toast(P[it.id].n+' 삭제했어요',()=>{items.splice(i,0,it);sel=was;refit();renderAll();});
  refit();renderAll();return;
 }
 if(a==='prevday'||a==='nextday'){const t=sd+(a==='prevday'?-1:1);items.splice(i,1);trip.days[t].items.push(it);sd=t;sel=trip.days[t].items.length-1;nb.hi=null;toast((t+1)+'일차로 옮겼어요');refit();renderAll();return;}
 if(a==='cat'){P[it.id].c=v;renderAll();return;}
 if(a==='alt'){
  const id=b.dataset.id,k=it.alts.indexOf(id);
  if(k>-1){it.alts.splice(k,1);if(ahi===id)ahi=null;toast('차선책에서 뺐어요');renderAll();}
  else{it.alts.push(id);ahi=id;toast('차선책으로 연결했어요');fitTo([curP(),P[id]],.6);renderAll();}
  return;
 }
 if(a==='altgo'){pickAlt(i,b.dataset.id);return;}
 if(a==='swap'){const id=b.dataset.id;it.alts[it.alts.indexOf(id)]=it.id;it.id=id;ahi=null;nb.hi=null;toast('차선책으로 바꿨어요');refit();renderAll();return;}
 if(a==='altdel'){it.alts.splice(it.alts.indexOf(b.dataset.id),1);if(ahi===b.dataset.id)ahi=null;renderAll();return;}
 if(a==='r'){nb.r=+v;nb.hi=null;refit();renderList();drawMap();return;}
 if(a==='t'){nb.t=v;nb.hi=null;renderList();drawMap();return;}
 if(a==='m'){nb.min=+v;nb.hi=null;renderList();drawMap();return;}
 if(a==='s'){nb.s=v;nb.hi=null;renderList();drawMap();return;}
 if(a==='hi'){nb.hi=b.dataset.id;renderList();drawMap();return;}
 if(a==='addnb'){const p=P[b.dataset.id];items.splice(sel+1,0,item(p.id));sel=sel+1;nb.hi=null;toast((sd+1)+'일차에 추가했어요');refit();renderAll();return;}
});

/* ---------- 끌어서 순서 바꾸기 ----------
   목록 위·아래 가장자리 56px 안으로 끌면 목록이 저절로 스크롤된다(가장자리에 가까울수록 빠르게).
   위치 계산은 스크롤된 만큼(ds)을 더해 내용 기준으로 한다 */
let drag=null;
list.addEventListener('pointerdown',e=>{
 const g=e.target.closest('[data-drag]');if(!g||all)return;
 e.preventDefault();g.setPointerCapture(e.pointerId);
 const rows=[...list.querySelectorAll('.stop')],i=+g.dataset.drag;
 drag={i,to:i,y0:e.clientY,y:e.clientY,s0:list.scrollTop,rows,box:rows.map(r=>r.getBoundingClientRect()),raf:0};
 rows[i].classList.add('dragging');drag.raf=requestAnimationFrame(dragTick);
});
function dragMove(){
 const d=drag,dy=d.y-d.y0+list.scrollTop-d.s0,b=d.box[d.i],cy=(b.top+b.bottom)/2+dy;
 d.to=d.box.filter((r,k)=>k!==d.i&&cy>(r.top+r.bottom)/2).length;
 d.rows.forEach((r,k)=>{
  const t=k===d.i?dy:(d.i<d.to&&k>d.i&&k<=d.to?-b.height:(d.to<d.i&&k>=d.to&&k<d.i?b.height:0));
  r.style.transform=t?'translateY('+t+'px)':'';
 });
}
function dragTick(){
 if(!drag)return;
 const r=list.getBoundingClientRect(),z=56,y=drag.y;
 const v=y<r.top+z?-Math.min(18,Math.ceil((r.top+z-y)/3)):(y>r.bottom-z?Math.min(18,Math.ceil((y-r.bottom+z)/3)):0);
 if(v){const s=list.scrollTop;list.scrollTop=s+v;if(list.scrollTop!==s)dragMove();}
 drag.raf=requestAnimationFrame(dragTick);
}
list.addEventListener('pointermove',e=>{if(!drag)return;drag.y=e.clientY;dragMove();});
function endDrag(){
 if(!drag)return;const d=drag;drag=null;cancelAnimationFrame(d.raf);
 d.rows.forEach(r=>{r.style.transform='';r.classList.remove('dragging');});
 if(d.to!==d.i){
  const items=trip.days[sd].items,cur=sel!=null?items[sel]:null,x=items.splice(d.i,1)[0];
  items.splice(d.to,0,x);sel=cur?items.indexOf(cur):null;refit();
  toast(P[x.id].n+' → '+(d.to+1)+'번째로 옮겼어요');
 }
 renderAll();
}
list.addEventListener('pointerup',endDrag);
list.addEventListener('pointercancel',endDrag);

$('#tabs').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(prev){toast('미리보기를 적용하거나 취소해 주세요');return;}
 ord=null;phi=null;cbox.classList.remove('on');
 if(b.dataset.day==='pool'){pool=true;all=false;sel=null;ahi=null;nb.hi=null;dpend=-1;refit();renderAll();return;}
 pool=false;
 if(b.dataset.act==='newday'){trip.days.push({start:'09:00',items:[]});all=false;sd=trip.days.length-1;sel=null;toast((sd+1)+'일차를 만들었어요');refit();renderAll();return;}
 if(b.dataset.day==='all'){all=true;sel=null;ahi=null;nb.hi=null;dpend=-1;refit();renderAll();return;}
 if(b.dataset.day!=null){all=false;sd=+b.dataset.day;sel=null;ahi=null;nb.hi=null;dpend=-1;refit();renderAll();}
});
list.addEventListener('change',e=>{
 if(e.target.classList.contains('ckin')){const it=trip.days[sd].items[+e.target.dataset.i];if(e.target.value){it.done=toMin(e.target.value);renderAll();}return;}
 if(!ap)return;if(e.target.id==='ap-h')ap.h=e.target.value;if(e.target.id==='ap-keep')ap.keep=e.target.checked;});
$('#sum').addEventListener('change',e=>{if(e.target.id==='stime'&&e.target.value){trip.days[sd].start=e.target.value;renderAll();}});
$('#dstart').addEventListener('change',e=>{if(e.target.value){trip.start=e.target.value;renderAll();}});
/* 제목·출발일: 평소엔 글자로만 보이고(시트를 끌 때 입력칸이 잡히지 않게), 연필을 눌러야 고친다 */
function renderHead(){$('#ttl-text').textContent=trip.title;$('#date-text').textContent=mdw(trip.start)+' 출발';}
function editHead(on){
 $('#head-view').hidden=on;$('#head-edit').hidden=!on;
 if(on){$('#title').value=trip.title;$('#dstart').value=trip.start;setTimeout(()=>$('#title').focus(),30);return;}
 trip.title=clean($('#title').value.trim())||'이름 없는 여행';$('#title').value=trip.title;renderAll();
}
$('#edit-btn').addEventListener('click',()=>editHead(true));
$('#edit-done').addEventListener('click',()=>editHead(false));
$('#title').addEventListener('keydown',e=>{if(e.key==='Enter')editHead(false);});
$('#refit').addEventListener('click',()=>{sel=null;nb.hi=null;ahi=null;refit();renderAll();});

/* ---------- 검색 ---------- */
/* lastQ: 후보에 담은 뒤 검색칸은 비우고, 직전 검색 결과는 새로 입력할 때까지 보여준다 */
let spick=null,lastQ='',fromDay=null; /* fromDay: 출발지를 찾는 중인 날 */
/* spv: 지도에서 보고 있는 검색 결과 / SRES: 지금 목록의 결과들(지도에 작은 핀) */
let spv=null,SRES=[];
const srchOn=()=>{const S=$('#search');return S.classList.contains('on')&&S.classList.contains('split');};
function previewSearch(id){
 spv=id;$('#search').classList.add('split');$('#app').classList.add('srch');
 fitTo([P[id]]);renderSearch();
 const r=$('#sres').querySelector('.sr[data-pv="'+id+'"]');if(r)r.scrollIntoView({block:'nearest'});
}
function openSearch(){spick=null;$('#search').classList.add('on');renderSearch();setTimeout(()=>$('#sq').focus(),50);}
function closeSearch(){
 fromDay=null;
 const was=srchOn();$('#search').classList.remove('on','split');$('#app').classList.remove('srch');sq='';lastQ='';$('#sq').value='';spv=null;SRES=[];
 if(was){refit();drawMap();}
}
/* 날짜가 여러 개면 "추가"를 눌렀을 때 넣을 날을 고른다 */
const picker=id=>'<div class="pick"><p class="sub">어디에 넣을까요?</p><div class="chips"><button class="chip" data-id="'+id+'" data-day="pool">'+ic('pin',14)+'후보에 담기</button>'+trip.days.map((d,i)=>'<button class="chip" data-id="'+id+'" data-day="'+i+'"><i class="dot" style="background:'+COL[i%5]+'"></i>'+(i+1)+'일차 '+dlabel(i)+'</button>').join('')+'</div></div>';
function renderSearch(){
 $('#sc').innerHTML=['전체'].concat(CATS).map(v=>'<button class="chip" data-c="'+v+'" aria-pressed="'+(scat===v)+'">'+(v==='전체'?'':cic(v,14))+v+'</button>').join('');
 const q=sq.trim()||lastQ,inTrip={},note=(fromDay!=null?'<p class="sub sq-last">'+(fromAll?'모든 날':(fromDay+1)+'일차')+' 출발지로 쓸 곳을 찾아 "출발지로"를 누르세요</p>':'')+(!sq.trim()&&lastQ?'<p class="sub sq-last">"'+clean(lastQ)+'" 검색 결과 · 새 장소는 위 검색칸에 입력하세요</p>':'');
 trip.days.forEach((d,i)=>d.items.forEach(it=>{(inTrip[it.id]=inTrip[it.id]||[]).push(i+1+'일차');}));
 trip.pool.forEach(id=>{(inTrip[id]=inTrip[id]||[]).push('후보');});
 let res;
 if(KM&&q){
  const r=KM.search(q,scat);
  if(!r||r.err){SRES=[];if(srchOn())drawMap();$('#sres').innerHTML=note+'<div class="empty"><p class="sub">'+(r?'카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.':'검색 중이에요…')+'</p></div>';return;}
  res=r.list;
 }else res=DB.filter(p=>(!KM||p.lat!=null)&&(scat==='전체'||p.c===scat)&&(!q||p.n.indexOf(q)>-1||p.c.indexOf(q)>-1)).slice(0,40);
 SRES=res.map(p=>p.id);if(srchOn())drawMap();
 $('#sres').innerHTML=note+(res.length?res.map(p=>'<div class="sr'+(spv===p.id?' on':'')+'" data-pv="'+p.id+'"><div>'+nameRow(p).replace('class="nm"','class="nm" style="font-size:14px"')+'<div class="sub">'+[p.c,p.r!=null?'<span class="star">★</span> '+p.r.toFixed(1)+' ('+p.v+')':'',p.a||'',inTrip[p.id]?inTrip[p.id].join(', ')+' 포함':''].filter(Boolean).join(' · ')+'</div></div>'+(fromDay!=null?'<button class="chip" data-from="'+p.id+'">'+ic('flag',14)+'출발지로</button>':'<button class="chip" data-add="'+p.id+'" aria-expanded="'+(spick===p.id)+'">'+ic('plus',14)+'추가</button>')+'</div>'+(spick===p.id?picker(p.id):'')).join('')
  :'<div class="empty"><p class="nm">검색 결과가 없어요</p><p class="sub">다른 이름이나 종류로 찾아보세요.</p></div>');
}
function addTo(id,di){
 if(di==='pool'){
  /* 검색창은 열어 둔 채 계속 담을 수 있게 한다 */
  const had=trip.pool.indexOf(id)>-1;if(!had)trip.pool.push(id);
  lastQ=sq.trim()||lastQ;sq='';$('#sq').value='';spick=null;
  pool=true;all=false;ord=null;sel=null;phi=id;
  toast(had?'이미 후보에 있어요':P[id].n+' 후보에 담았어요 · 후보 '+trip.pool.length+'곳');
  refit();renderAll();renderSearch();return;
 }
 const items=trip.days[di].items;items.push(item(id));
 all=false;sd=di;sel=items.length-1;nb.hi=null;ahi=null;spick=null;closeSearch();toast((di+1)+'일차에 추가했어요');
 if(sheetH<220)setSheet(snaps()[1],true);else refit();
 renderAll();
}
$('#open-s').addEventListener('click',openSearch);
$('#sclose').addEventListener('click',closeSearch);
$('#sq').addEventListener('input',e=>{sq=e.target.value;lastQ='';spick=null;renderSearch();});
$('#sc').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b){scat=b.dataset.c;spick=null;renderSearch();}});
$('#sres').addEventListener('click',e=>{
 const fb=e.target.closest('[data-from]');if(fb){setFrom(fromDay,fb.dataset.from,fromAll);closeSearch();return;}
 const ad=e.target.closest('[data-add]');
 if(ad){const id=ad.dataset.add;spick=spick===id?null:id;renderSearch();return;}
 const b=e.target.closest('[data-day]');if(b){addTo(b.dataset.id,b.dataset.day==='pool'?'pool':+b.dataset.day);return;}
 const r=e.target.closest('[data-pv]');if(r)previewSearch(r.dataset.pv);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();});

/* ---------- 날짜 삭제 ---------- */
$('#sum').addEventListener('click',e=>{
 const b=e.target.closest('[data-act="delday"]');if(!b)return;
 if(trip.days[sd].items.length&&dpend!==sd){dpend=sd;renderTabs();return;}
 trip.days.splice(sd,1);dpend=-1;sd=Math.min(sd,trip.days.length-1);sel=null;nb.hi=null;ahi=null;
 toast('날짜를 삭제했어요');refit();renderAll();
});
