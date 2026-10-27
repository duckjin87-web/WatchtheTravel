/* ---------- 목록 ---------- */
const sumOf=rows=>({mins:rows.reduce((a,r)=>a+r.dm,0),km:rows.reduce((a,r)=>a+r.km,0)});
function renderTabs(){
 $('#tabs').innerHTML='<button class="tab" role="tab" aria-selected="'+all+'" data-day="all">전체</button>'
  +trip.days.map((d,i)=>'<button class="tab" role="tab" aria-selected="'+(!all&&i===sd)+'" data-day="'+i+'"><i class="dot" style="background:'+COL[i%5]+'"></i>'+(i+1)+'일차 <span class="sub">'+dlabel(i)+'</span></button>').join('')
  +'<button class="tab" data-act="newday" aria-label="날짜 추가">'+ic('plus',16)+'</button>';
 if(all){
  const R=trip.days.map((_,i)=>sched(i)),S=sumOf(R.flat());
  $('#sum').innerHTML='<span>'+trip.days.length+'일 · '+R.reduce((a,r)=>a+r.length,0)+'곳 · 이동 '+dur(S.mins)+' · '+fmtD(S.km)+'</span>';
  return;
 }
 const rows=sched(sd),d=trip.days[sd],S=sumOf(rows);
 $('#sum').innerHTML='<span>'+rows.length+'곳 · 이동 '+dur(S.mins)+' · '+fmtD(S.km)+'</span><span style="display:flex;gap:8px;align-items:center">'+(trip.days.length>1?'<button class="chip" data-act="delday">'+(dpend===sd?(d.items.length?d.items.length+'곳 함께 삭제 · 한 번 더':'한 번 더 누르면 삭제'):'날짜 삭제')+'</button>':'')+'<label>시작 <input type="time" id="stime" aria-label="'+(sd+1)+'일차 시작 시각" value="'+d.start+'"></label></span>';
}
/* 이동 줄: 일차 화면에서는 자동차/도보를 바로 바꿀 수 있다 */
function driveRow(r,i,edit){
 const s=r.s,w=!!s.walk;
 return '<div class="drive">'+(edit
   ?'<span class="seg" role="group" aria-label="이동 수단"><button data-act="mode" data-i="'+i+'" data-v="car" aria-pressed="'+!w+'">'+ic('car',14)+'차</button><button data-act="mode" data-i="'+i+'" data-v="walk" aria-pressed="'+w+'">'+ic('shoe',14)+'도보</button></span>'
   :ic(w?'shoe':'car',16))
  +'<span>'+hm(r.dep)+' 출발 · '+(w?'도보 ':'차로 ')+dur(r.dm)+' · '+fmtD(s.km)+' · '+hm(r.dep+r.dm)+' 도착'+(KM&&s.est&&!w?' · 직선 추정':'')+'</span></div>';
}
const nameRow=p=>'<div class="nm"><span class="ci">'+cic(p.c,16)+'</span>'+p.n+'</div>';
function renderList(){
 const st=list.scrollTop;let h='';
 if(all)h=allList();
 else{
  const rows=sched(sd),c=COL[sd%5];
  if(!rows.length)h+='<div class="empty"><p class="nm">'+(sd+1)+'일차 일정이 비어 있어요</p><p class="sub">방문지를 추가하면 이동 시간이 자동으로 계산돼요.</p></div>';
  rows.forEach((r,i)=>{
   const last=i===rows.length-1,open=sel===i,alts=r.it.alts;
   h+='<div class="stop'+(pg&&i<pg.passed?' done':'')+'"><div class="rail"><span class="num" style="background:'+c+'">'+(i+1)+'</span>'+(last?'':'<span class="line" style="background:'+c+'"></span>')+'</div><div class="main">'
    +'<div class="card'+(open?' open':'')+'"><button class="cm" data-act="sel" data-i="'+i+'" aria-expanded="'+open+'">'+nameRow(r.p)+'<div class="tm">'+hm(r.arr)+'–'+hm(r.dep)+'</div></button>'
    +'<div class="ed"><span class="cat">'+r.p.c+'</span><span class="stay"><button class="ib sm" data-act="stay" data-i="'+i+'" data-v="-30" aria-label="머무는 시간 30분 줄이기">'+ic('minus',16)+'</button><span class="sub">'+dur(r.it.stay)+'</span><button class="ib sm" data-act="stay" data-i="'+i+'" data-v="30" aria-label="머무는 시간 30분 늘리기">'+ic('plus',16)+'</button></span>'
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
/* 전체 탭: 날짜별로 이어서 보여주고, 누르면 그 날 그 방문지로 이동한다 */
function allList(){
 let h='';
 trip.days.forEach((d,di)=>{
  const rows=sched(di),c=COL[di%5],S=sumOf(rows);
  h+='<button class="dtitle" data-act="day" data-day="'+di+'"><i class="dot" style="background:'+c+'"></i>'+(di+1)+'일차 '+dlabel(di)+'<span class="sub">'+d.start+' 시작 · '+rows.length+'곳 · 이동 '+dur(S.mins)+'</span></button>';
  if(!rows.length)h+='<p class="sub" style="margin:0 0 8px 32px">일정이 비어 있어요</p>';
  rows.forEach((r,i)=>{
   const last=i===rows.length-1;
   h+='<div class="stop"><div class="rail"><span class="num" style="background:'+c+'">'+(i+1)+'</span>'+(last?'':'<span class="line" style="background:'+c+'"></span>')+'</div><div class="main">'
    +'<button class="card cm" data-act="go" data-day="'+di+'" data-i="'+i+'">'+nameRow(r.p)+'<div class="tm">'+hm(r.arr)+'–'+hm(r.dep)+'</div></button>'
    +(r.it.alts.length?'<div class="alts">'+ic('alt',14)+'<span class="sub">차선책 '+r.it.alts.length+'곳</span></div>':'')
    +(last?'':driveRow(r,i,false))+'</div></div>';
  });
 });
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
function renderAll(){renderTabs();pg=prog();renderG();renderList();drawMap();saveTrip();}

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
 if(a==='stay'){it.stay=Math.max(30,Math.min(720,it.stay+ +v));renderAll();return;}
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

/* ---------- 끌어서 순서 바꾸기 ---------- */
let drag=null;
list.addEventListener('pointerdown',e=>{
 const g=e.target.closest('[data-drag]');if(!g||all)return;
 e.preventDefault();g.setPointerCapture(e.pointerId);
 const rows=[...list.querySelectorAll('.stop')],i=+g.dataset.drag;
 drag={i,to:i,y0:e.clientY,rows,box:rows.map(r=>r.getBoundingClientRect())};
 rows[i].classList.add('dragging');
});
list.addEventListener('pointermove',e=>{
 if(!drag)return;const d=drag,dy=e.clientY-d.y0,b=d.box[d.i],cy=(b.top+b.bottom)/2+dy;
 d.to=d.box.filter((r,k)=>k!==d.i&&cy>(r.top+r.bottom)/2).length;
 d.rows.forEach((r,k)=>{
  const t=k===d.i?dy:(d.i<d.to&&k>d.i&&k<=d.to?-b.height:(d.to<d.i&&k>=d.to&&k<d.i?b.height:0));
  r.style.transform=t?'translateY('+t+'px)':'';
 });
});
function endDrag(){
 if(!drag)return;const d=drag;drag=null;
 d.rows.forEach(r=>{r.style.transform='';r.classList.remove('dragging');});
 if(d.to!==d.i){
  const items=trip.days[sd].items,cur=sel!=null?items[sel]:null,x=items.splice(d.i,1)[0];
  items.splice(d.to,0,x);sel=cur?items.indexOf(cur):null;refit();
 }
 renderAll();
}
list.addEventListener('pointerup',endDrag);
list.addEventListener('pointercancel',endDrag);

$('#tabs').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.act==='newday'){trip.days.push({start:'09:00',items:[]});all=false;sd=trip.days.length-1;sel=null;toast((sd+1)+'일차를 만들었어요');refit();renderAll();return;}
 if(b.dataset.day==='all'){all=true;sel=null;ahi=null;nb.hi=null;dpend=-1;refit();renderAll();return;}
 if(b.dataset.day!=null){all=false;sd=+b.dataset.day;sel=null;ahi=null;nb.hi=null;dpend=-1;refit();renderAll();}
});
$('#sum').addEventListener('change',e=>{if(e.target.id==='stime'&&e.target.value){trip.days[sd].start=e.target.value;renderAll();}});
$('#dstart').addEventListener('change',e=>{if(e.target.value){trip.start=e.target.value;renderAll();}});
$('#title').addEventListener('input',saveTrip);
$('#refit').addEventListener('click',()=>{sel=null;nb.hi=null;ahi=null;refit();renderAll();});

/* ---------- 검색 ---------- */
let spick=null;
function openSearch(){spick=null;$('#search').classList.add('on');renderSearch();setTimeout(()=>$('#sq').focus(),50);}
function closeSearch(){$('#search').classList.remove('on');}
/* 날짜가 여러 개면 "추가"를 눌렀을 때 넣을 날을 고른다 */
const picker=id=>'<div class="pick"><p class="sub">어느 날에 넣을까요?</p><div class="chips">'+trip.days.map((d,i)=>'<button class="chip" data-id="'+id+'" data-day="'+i+'"><i class="dot" style="background:'+COL[i%5]+'"></i>'+(i+1)+'일차 '+dlabel(i)+'</button>').join('')+'</div></div>';
function renderSearch(){
 $('#sc').innerHTML=['전체'].concat(CATS).map(v=>'<button class="chip" data-c="'+v+'" aria-pressed="'+(scat===v)+'">'+(v==='전체'?'':cic(v,14))+v+'</button>').join('');
 const q=sq.trim(),inTrip={};
 trip.days.forEach((d,i)=>d.items.forEach(it=>{(inTrip[it.id]=inTrip[it.id]||[]).push(i+1);}));
 let res;
 if(KM&&q){
  const r=KM.search(q,scat);
  if(!r||r.err){$('#sres').innerHTML='<div class="empty"><p class="sub">'+(r?'카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.':'검색 중이에요…')+'</p></div>';return;}
  res=r.list;
 }else res=DB.filter(p=>(!KM||p.lat!=null)&&(scat==='전체'||p.c===scat)&&(!q||p.n.indexOf(q)>-1||p.c.indexOf(q)>-1)).slice(0,40);
 $('#sres').innerHTML=res.length?res.map(p=>'<div class="sr"><div>'+nameRow(p).replace('class="nm"','class="nm" style="font-size:14px"')+'<div class="sub">'+[p.c,p.r!=null?'<span class="star">★</span> '+p.r.toFixed(1)+' ('+p.v+')':'',p.a||'',inTrip[p.id]?inTrip[p.id].join(', ')+'일차 포함':''].filter(Boolean).join(' · ')+'</div></div><button class="chip" data-add="'+p.id+'" aria-expanded="'+(spick===p.id)+'">'+ic('plus',14)+'추가</button></div>'+(spick===p.id?picker(p.id):'')).join('')
  :'<div class="empty"><p class="nm">검색 결과가 없어요</p><p class="sub">다른 이름이나 종류로 찾아보세요.</p></div>';
}
function addTo(id,di){
 const items=trip.days[di].items;items.push(item(id));
 all=false;sd=di;sel=items.length-1;nb.hi=null;ahi=null;spick=null;closeSearch();toast((di+1)+'일차에 추가했어요');
 if(sheetH<220)setSheet(snaps()[1],true);else refit();
 renderAll();
}
$('#open-s').addEventListener('click',openSearch);
$('#sclose').addEventListener('click',closeSearch);
$('#sq').addEventListener('input',e=>{sq=e.target.value;spick=null;renderSearch();});
$('#sc').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b){scat=b.dataset.c;spick=null;renderSearch();}});
$('#sres').addEventListener('click',e=>{
 const ad=e.target.closest('[data-add]');
 if(ad){const id=ad.dataset.add;if(trip.days.length===1)addTo(id,0);else{spick=spick===id?null:id;renderSearch();}return;}
 const b=e.target.closest('[data-day]');if(b)addTo(b.dataset.id,+b.dataset.day);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();});

/* ---------- 날짜 삭제 ---------- */
$('#sum').addEventListener('click',e=>{
 const b=e.target.closest('[data-act="delday"]');if(!b)return;
 if(trip.days[sd].items.length&&dpend!==sd){dpend=sd;renderTabs();return;}
 trip.days.splice(sd,1);dpend=-1;sd=Math.min(sd,trip.days.length-1);sel=null;nb.hi=null;ahi=null;
 toast('날짜를 삭제했어요');refit();renderAll();
});
