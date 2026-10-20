/* ---------- 목록 ---------- */
function renderTabs(){
 $('#tabs').innerHTML=trip.days.map((d,i)=>'<button class="tab" role="tab" aria-selected="'+(i===sd)+'" data-day="'+i+'"><i class="dot" style="background:'+COL[i%5]+'"></i>'+(i+1)+'일차 <span class="sub">'+dlabel(i)+'</span></button>').join('')
  +'<button class="tab" data-act="newday" aria-label="날짜 추가">'+ic('plus',16)+'</button>';
 const rows=sched(sd),d=trip.days[sd];
 const mins=rows.reduce((a,r)=>a+r.dm,0),km=rows.reduce((a,r)=>a+r.km,0);
 $('#sum').innerHTML='<span>'+rows.length+'곳 · 이동 '+dur(mins)+' · '+km+'km</span><span style="display:flex;gap:8px;align-items:center">'+(trip.days.length>1?'<button class="chip" data-act="delday">'+(dpend===sd?(d.items.length?d.items.length+'곳 함께 삭제 · 한 번 더':'한 번 더 누르면 삭제'):'날짜 삭제')+'</button>':'')+'<label>시작 <input type="time" id="stime" aria-label="'+(sd+1)+'일차 시작 시각" value="'+d.start+'"></label></span>';
}
function renderList(){
 const st=list.scrollTop,rows=sched(sd),c=COL[sd%5];let h='';
 if(!rows.length)h+='<div class="empty"><p class="nm">'+(sd+1)+'일차 일정이 비어 있어요</p><p class="sub">방문지를 추가하면 이동 시간이 자동으로 계산돼요.</p></div>';
 rows.forEach((r,i)=>{
  const last=i===rows.length-1,open=sel===i;
  h+='<div class="stop'+(pg&&i<pg.passed?' done':'')+'"><div class="rail"><span class="num" style="background:'+c+'">'+(i+1)+'</span>'+(last?'':'<span class="line" style="background:'+c+'"></span>')+'</div><div class="main">'
   +'<button class="card" data-act="sel" data-i="'+i+'" aria-expanded="'+open+'"><div><div class="nm">'+r.p.n+'<span class="cat">'+r.p.c+'</span></div><div class="sub">머무는 시간 '+dur(r.it.stay)+'</div></div><div class="tm">'+hm(r.arr)+'–'+hm(r.dep)+'</div></button>';
  if(open)h+=detail(i,r);
  if(!last)h+='<div class="drive">'+ic('car',16)+'<span>'+hm(r.dep)+' 출발 · 차로 '+dur(r.dm)+' · '+r.km+'km · '+hm(r.dep+r.dm)+' 도착</span></div>';
  h+='</div></div>';
 });
 h+='<button class="add" data-act="open-search">'+ic('plus',16)+' 방문지 추가</button>';
 list.innerHTML=h;list.scrollTop=st;
}
function chip(act,v,label,on,extra){return '<button class="chip" data-act="'+act+'" data-v="'+v+'" aria-pressed="'+on+'">'+label+'</button>';}
function detail(i,r){
 const n=trip.days.length,L=nearby();
 let h='<div class="detail"><div class="tools"><div class="stay"><button class="ib" data-act="stay" data-v="-30" aria-label="체류 30분 줄이기">'+ic('minus')+'</button><span class="sub" style="min-width:116px;text-align:center">머무는 시간 '+dur(r.it.stay)+'</span><button class="ib" data-act="stay" data-v="30" aria-label="체류 30분 늘리기">'+ic('plus')+'</button></div></div><div class="chips">';
 if(i>0)h+='<button class="chip" data-act="up">'+ic('up',16)+'위로</button>';
 if(i<trip.days[sd].items.length-1)h+='<button class="chip" data-act="down">'+ic('down',16)+'아래로</button>';
 if(sd>0)h+='<button class="chip" data-act="prevday">'+ic('left',16)+'전날로</button>';
 if(sd<n-1)h+='<button class="chip" data-act="nextday">다음날로'+ic('right',16)+'</button>';
 h+='<button class="chip" data-act="del">'+ic('trash',16)+'삭제</button></div>';
 h+='<div class="nbh"><span class="nm" style="font-size:14px">근처 맛집·카페</span><span class="sub">'+L.length+'곳</span></div>';
 h+='<div class="chips">'+[1,3,5,10].map(v=>chip('r',v,v+'km',nb.r===v)).join('')+'</div>';
 h+='<div class="chips">'+['전체','맛집','카페'].map(v=>chip('t',v,v,nb.t===v)).join('')+'</div>';
 h+='<div class="chips">'+[['전체','출처 전체'],['카카오','카카오'],['네이버','네이버']].map(a=>chip('s',a[0],a[1],nb.s===a[0])).join('')+'</div>';
 h+='<div class="chips">'+[[0,'평점 전체'],[3.5,'3.5+'],[4,'4.0+'],[4.3,'4.3+']].map(a=>chip('m',a[0],a[1],nb.min===a[0])).join('')+'</div>';
 h+='<div style="margin-top:8px">';
 if(!L.length)h+='<p class="sub" style="margin:10px 0 0">이 조건에 맞는 곳이 없어요. 반경을 넓히거나 평점 조건을 낮춰 보세요.</p>';
 L.slice(0,8).forEach(e=>{
  h+='<div class="nb'+(nb.hi===e.p.id?' on':'')+'" data-act="hi" data-id="'+e.p.id+'"><div><div class="nm" style="font-size:14px">'+e.p.n+'<span class="cat">'+e.p.c+'</span></div><div class="sub">'+(e.p.r!=null?'<span class="star">★</span> '+e.p.r.toFixed(1)+' ('+e.p.v+')':'평점 없음')+' · '+fmtD(e.d)+' · '+e.p.src+'</div></div><button class="ib" data-act="addnb" data-id="'+e.p.id+'" aria-label="'+e.p.n+' 일정에 추가">'+ic('plus')+'</button></div>';
 });
 if(L.length>8)h+='<p class="sub" style="margin:6px 0 0">가까운 순으로 8곳만 보여줘요.</p>';
 h+='</div><p class="foot">예시 데이터예요. 카카오와 네이버 검색 결과를 합쳐 보여주고, 같은 장소는 하나로 묶어요. 네이버 검색 API는 평점을 주지 않아서 평점은 카카오 장소 상세 값만 표시해요.</p></div>';
 return h;
}
function renderAll(keep){renderTabs();pg=prog();renderG();renderList();drawMap();}

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),1800);}

list.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const a=b.dataset.act,v=b.dataset.v,items=trip.days[sd].items;
 if(a==='sel'){const i=+b.dataset.i;sel=sel===i?null:i;nb.hi=null;afterSel();return;}
 if(a==='open-search'){openSearch();return;}
 if(a==='stay'){const it=items[sel];it.stay=Math.max(30,Math.min(480,it.stay+ +v));renderAll();return;}
 if(a==='up'||a==='down'){const j=a==='up'?sel-1:sel+1;[items[sel],items[j]]=[items[j],items[sel]];sel=j;renderAll();return;}
 if(a==='prevday'||a==='nextday'){const t=sd+(a==='prevday'?-1:1),it=items.splice(sel,1)[0];trip.days[t].items.push(it);sd=t;sel=trip.days[t].items.length-1;nb.hi=null;toast((t+1)+'일차로 옮겼어요');refit();renderAll();return;}
 if(a==='del'){items.splice(sel,1);sel=null;refit();renderAll();return;}
 if(a==='r'){nb.r=+v;nb.hi=null;refit();renderList();drawMap();return;}
 if(a==='t'){nb.t=v;nb.hi=null;renderList();drawMap();return;}
 if(a==='m'){nb.min=+v;nb.hi=null;renderList();drawMap();return;}
 if(a==='s'){nb.s=v;nb.hi=null;renderList();drawMap();return;}
 if(a==='hi'){if(e.target.closest('[data-act="addnb"]'))return;nb.hi=b.dataset.id;renderList();drawMap();return;}
 if(a==='addnb'){const p=P[b.dataset.id];items.splice(sel+1,0,{id:p.id,stay:defStay(p)});sel=sel+1;nb.hi=null;toast((sd+1)+'일차에 추가했어요');refit();renderAll();return;}
});
$('#tabs').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.act==='newday'){trip.days.push({start:'09:00',items:[]});sd=trip.days.length-1;sel=null;toast((sd+1)+'일차를 만들었어요');refit();renderAll();return;}
 if(b.dataset.day!=null){sd=+b.dataset.day;sel=null;nb.hi=null;dpend=-1;refit();renderAll();}
});
$('#sum').addEventListener('change',e=>{if(e.target.id==='stime'&&e.target.value){trip.days[sd].start=e.target.value;renderAll();}});
$('#dstart').addEventListener('change',e=>{if(e.target.value){trip.start=e.target.value;renderTabs();}});
$('#refit').addEventListener('click',()=>{sel=null;nb.hi=null;refit();renderAll();});

/* ---------- 검색 ---------- */
function openSearch(){$('#search').classList.add('on');renderSearch();setTimeout(()=>$('#sq').focus(),50);}
function closeSearch(){$('#search').classList.remove('on');}
function renderSearch(){
 $('#sc').innerHTML=['전체','명소','맛집','카페'].map(v=>'<button class="chip" data-c="'+v+'" aria-pressed="'+(scat===v)+'">'+v+'</button>').join('');
 const q=sq.trim(),inTrip={};
 trip.days.forEach((d,i)=>d.items.forEach(it=>{(inTrip[it.id]=inTrip[it.id]||[]).push(i+1);}));
 const res=DB.filter(p=>(scat==='전체'||p.c===scat)&&(!q||p.n.indexOf(q)>-1||p.c.indexOf(q)>-1)).slice(0,40);
 $('#sres').innerHTML=res.length?res.map(p=>'<div class="sr"><div><div class="nm" style="font-size:14px">'+p.n+'<span class="cat">'+p.c+'</span></div><div class="sub">'+(p.r!=null?'<span class="star">★</span> '+p.r.toFixed(1)+' ('+p.v+')':'')+(inTrip[p.id]?(p.r!=null?' · ':'')+inTrip[p.id].join(', ')+'일차 포함':'')+'</div></div><button class="chip" data-id="'+p.id+'">'+(sd+1)+'일차에 추가</button></div>').join('')
  :'<div class="empty"><p class="nm">검색 결과가 없어요</p><p class="sub">다른 이름이나 종류로 찾아보세요.</p></div>';
}
$('#open-s').addEventListener('click',openSearch);
$('#sclose').addEventListener('click',closeSearch);
$('#sq').addEventListener('input',e=>{sq=e.target.value;renderSearch();});
$('#sc').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b){scat=b.dataset.c;renderSearch();}});
$('#sres').addEventListener('click',e=>{
 const b=e.target.closest('[data-id]');if(!b)return;
 const p=P[b.dataset.id],items=trip.days[sd].items;items.push({id:p.id,stay:defStay(p)});
 sel=items.length-1;nb.hi=null;closeSearch();toast((sd+1)+'일차에 추가했어요');
 if(sheetH<220)setSheet(snaps()[1],true);else refit();
 renderAll();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();});

/* ---------- 날짜 삭제 ---------- */
$('#sum').addEventListener('click',e=>{
 const b=e.target.closest('[data-act="delday"]');if(!b)return;
 if(trip.days[sd].items.length&&dpend!==sd){dpend=sd;renderTabs();return;}
 trip.days.splice(sd,1);dpend=-1;sd=Math.min(sd,trip.days.length-1);sel=null;nb.hi=null;
 toast('날짜를 삭제했어요');refit();renderAll();
});

