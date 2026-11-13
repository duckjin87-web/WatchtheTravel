/* ---------- 여행 목록 (첫 화면) ----------
   이번 여행: 마지막 날이 오늘이거나 아직 안 온 여행 / 지난 여행: 마지막 날이 지난 여행.
   arch=true 는 직접 지난 여행으로 보낸 것, arch=false 는 지난 여행을 이번 여행으로 되돌린 것이다. */
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dateOf=s=>new Date(s+'T00:00:00');
const addDays=(s,n)=>{const d=dateOf(s);d.setDate(d.getDate()+n);return isoOf(d);};
const dayDiff=(a,b)=>Math.round((dateOf(b)-dateOf(a))/864e5);
const todayIso=()=>isoOf(new Date());
const md=s=>{const d=dateOf(s);return (d.getMonth()+1)+'/'+d.getDate();};
const mdw=s=>md(s)+'('+'일월화수목금토'[dateOf(s).getDay()]+')';
const nights=n=>n>1?(n-1)+'박 '+n+'일':'당일';
function tripState(t){
 const td=todayIso(),end=addDays(t.start,t.days.length-1);
 const past=t.arch===true||(t.arch!==false&&end<td);
 const badge=t.start>td?'D-'+dayDiff(td,t.start):(end>=td?'여행 중':'완료');
 return{past,end,badge};
}
let htab='now',hmenu=null,hdel=null;
const home=$('#home');
/* 카드 미리보기: 일차별 색으로 방문지를 이은 선 */
function thumb(t){
 const pts=t.days.flatMap(d=>d.items.map(it=>P[it.id]));
 if(!pts.length)return '<div class="tc-empty">아직 방문지가 없어요</div>';
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);});
 const W2=300,H2=84,pad=14,s=Math.min((W2-2*pad)/((x1-x0)||1),(H2-2*pad)/((y1-y0)||1)),ox=(W2-(x1-x0)*s)/2,oy=(H2-(y1-y0)*s)/2;
 const q=p=>((p.x-x0)*s+ox).toFixed(1)+' '+((p.y-y0)*s+oy).toFixed(1);
 return '<svg viewBox="0 0 '+W2+' '+H2+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+t.days.map((d,i)=>{
  const L=d.items.map(it=>P[it.id]);if(!L.length)return'';const c=COL[i%5];
  return (L.length>1?'<path d="M'+L.map(q).join('L')+'" fill="none" stroke="'+c+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>':'')
   +L.map(p=>{const a=q(p).split(' ');return '<circle cx="'+a[0]+'" cy="'+a[1]+'" r="3.5" fill="'+c+'" stroke="#fff" stroke-width="1.5"/>';}).join('');
 }).join('')+'</svg>';
}
function renderHome(){
 const S=TRIPS.map(t=>({t,s:tripState(t)})),now=S.filter(x=>!x.s.past).sort((a,b)=>a.t.start<b.t.start?-1:1),past=S.filter(x=>x.s.past).sort((a,b)=>a.t.start>b.t.start?-1:1);
 const L=htab==='now'?now:past;
 let h='<div class="hh"><h1>내 여행</h1></div><div class="htabs" role="tablist"><button role="tab" data-ht="now" aria-selected="'+(htab==='now')+'">이번 여행 '+now.length+'</button><button role="tab" data-ht="past" aria-selected="'+(htab==='past')+'">지난 여행 '+past.length+'</button></div><div class="hl">';
 if(!L.length)h+='<div class="empty"><p class="nm">'+(htab==='now'?'계획 중인 여행이 없어요':'지난 여행이 없어요')+'</p><p class="sub">'+(htab==='now'?'아래 "여행 추가"로 새 여행을 만들어 보세요.':'마지막 날이 지난 여행이 여기로 옮겨져요.')+'</p></div>';
 L.forEach(({t,s})=>{
  const n=t.days.reduce((a,d)=>a+d.items.length,0),open=hmenu===t.id;
  h+='<div class="tcard'+(t===trip?' cur':'')+'"><button class="tc-open" data-open="'+t.id+'"><div class="tc-map">'+thumb(t)+'</div><div class="tc-body"><div><div class="nm">'+t.title+'</div><div class="sub">'+md(t.start)+' – '+md(s.end)+' · '+nights(t.days.length)+' · '+n+'곳</div></div><span class="badge'+(s.badge==='여행 중'?' g':(s.badge==='완료'?' x':''))+'">'+s.badge+'</span></div></button>'
   +'<button class="ib tc-more" data-menu="'+t.id+'" aria-expanded="'+open+'" aria-label="'+t.title+' 메뉴">'+ic('more')+'</button>';
  if(open)h+='<div class="chips tc-menu"><button class="chip" data-copy="'+t.id+'">'+ic('swap',14)+'다시 계획하기</button>'
   +(s.past?'<button class="chip" data-arch="'+t.id+'" data-v="0">이번 여행으로 되돌리기</button>':'<button class="chip" data-arch="'+t.id+'" data-v="1">지난 여행으로 보내기</button>')
   +'<button class="chip warn" data-del="'+t.id+'">'+ic('trash',14)+(hdel===t.id?'한 번 더 누르면 삭제':'삭제')+'</button></div>';
  h+='</div>';
 });
 h+='</div><button class="hfab" id="trip-new">'+ic('plus',16)+'여행 추가</button>';
 home.innerHTML=h;
}
function openHome(){stopAll();renderG();hmenu=null;hdel=null;htab=tripState(trip).past&&TRIPS.indexOf(trip)>-1?'past':'now';home.classList.add('on');renderHome();}
function closeHome(){home.classList.remove('on');}
function openTrip(t){
 stopAll();gmsg='';trip=t;sd=0;all=false;pool=false;ord=null;phi=null;sel=null;ahi=null;nb.hi=null;dpend=-1;
 $('#title').value=t.title;$('#dstart').value=t.start;$('#head-view').hidden=false;$('#head-edit').hidden=true;
 closeHome();refit();renderAll();
}
const tripById=id=>TRIPS.find(t=>t.id===id);
home.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.ht){htab=d.ht;hmenu=null;renderHome();return;}
 if(d.open){openTrip(tripById(d.open));return;}
 if(d.menu){hmenu=hmenu===d.menu?null:d.menu;hdel=null;renderHome();return;}
 if(d.arch){const t=tripById(d.arch);t.arch=d.v==='1';hmenu=null;saveTrip();toast(t.arch?'지난 여행으로 보냈어요':'이번 여행으로 되돌렸어요');renderHome();return;}
 if(d.del){
  if(hdel!==d.del){hdel=d.del;renderHome();return;}
  const t=tripById(d.del);TRIPS.splice(TRIPS.indexOf(t),1);hdel=hmenu=null;
  if(t===trip&&TRIPS.length)trip=TRIPS[0];
  saveTrip();toast('여행을 삭제했어요');renderHome();return;
 }
 if(d.copy){openNew(tripById(d.copy));return;}
 if(b.id==='trip-new')openNew(null);
});
$('#home-open').addEventListener('click',()=>{if(prev){toast('미리보기를 적용하거나 취소해 주세요');return;}ord=null;saveTrip();openHome();});

/* ---------- 새 여행 ---------- */
const nf=$('#newtrip');
let nt=null;
function openNew(src){
 const td=todayIso(),a=src?addDays(td,7):null;
 nt={src,name:src?src.title+' 다시':'',a,b:src?addDays(a,src.days.length-1):null,mon:(a||td).slice(0,7)};
 nf.classList.add('on');renderNew();setTimeout(()=>$('#nt-name').focus(),50);
}
function closeNew(){nf.classList.remove('on');nt=null;}
function renderNew(){
 const y=+nt.mon.slice(0,4),m=+nt.mon.slice(5,7),first=new Date(y,m-1,1),last=new Date(y,m,0).getDate(),td=todayIso();
 let cal='';for(let i=0;i<first.getDay();i++)cal+='<span></span>';
 for(let d=1;d<=last;d++){
  const s=nt.mon+'-'+String(d).padStart(2,'0'),e=nt.b||nt.a,inR=nt.a&&s>=nt.a&&s<=e,edge=s===nt.a||s===e;
  cal+='<button data-d="'+s+'" class="'+(inR?(edge?'edge':'mid'):'')+(s===td?' today':'')+'" aria-pressed="'+!!edge+'" aria-label="'+(m)+'월 '+d+'일">'+d+'</button>';
 }
 const n=nt.a?dayDiff(nt.a,nt.b||nt.a)+1:0;
 nf.innerHTML='<div class="nh"><button class="ib" id="nt-x" aria-label="닫기">'+ic('x')+'</button><b>'+(nt.src?'다시 계획하기':'새 여행')+'</b></div>'
  +'<label class="fld"><span class="sub">여행 이름</span><input id="nt-name" maxlength="40" placeholder="예: 강릉 바다 여행" value="'+nt.name.replace(/"/g,'')+'"></label>'
  +'<p class="nq">언제 가세요?</p><p class="sub" style="margin:0">출발일을 누른 다음 마지막 날을 누르세요. 하루짜리면 출발일만 누르면 돼요.</p>'
  +'<div class="calh"><button class="ib" data-mv="-1" aria-label="이전 달">'+ic('left')+'</button><b>'+y+'년 '+m+'월</b><button class="ib" data-mv="1" aria-label="다음 달">'+ic('right')+'</button></div>'
  +'<div class="cal">'+'일월화수목금토'.split('').map(w=>'<span class="w">'+w+'</span>').join('')+cal+'</div>'
  +'<p class="nsum">'+(n?mdw(nt.a)+(n>1?' – '+mdw(nt.b):'')+' · '+nights(n):'날짜를 골라 주세요')+'</p>'
  +(nt.src?'<p class="sub" style="margin:0">"'+nt.src.title+'"의 일정을 복사해요.'+(n&&n<nt.src.days.length?' 기간이 짧아서 '+(n+1)+'일차부터는 빠져요.':'')+'</p>':'')
  +'<button class="btn-main" id="nt-go"'+(n&&nt.name.trim()?'':' disabled')+'>만들고 일정 짜기</button>';
}
nf.addEventListener('input',e=>{if(e.target.id==='nt-name'){nt.name=e.target.value;$('#nt-go').disabled=!(nt.a&&nt.name.trim());}});
nf.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='nt-x'){closeNew();return;}
 if(b.dataset.mv){const d=dateOf(nt.mon+'-01');d.setMonth(d.getMonth()+ +b.dataset.mv);nt.mon=isoOf(d).slice(0,7);renderNew();return;}
 if(b.dataset.d){
  const s=b.dataset.d;
  if(!nt.a||nt.b||s<nt.a){nt.a=s;nt.b=null;}
  else if(dayDiff(nt.a,s)>29){toast('여행 기간은 30일까지예요');return;}
  else nt.b=s===nt.a?null:s;
  renderNew();return;
 }
 if(b.id==='nt-go'){
  const n=dayDiff(nt.a,nt.b||nt.a)+1,src=nt.src;
  const days=Array.from({length:n},(_,i)=>src&&src.days[i]?JSON.parse(JSON.stringify(src.days[i])):{start:'09:00',items:[]});
  const t={id:'t'+Date.now().toString(36),title:clean(nt.name.trim()),start:nt.a,pool:src?src.pool.slice():[],days};
  TRIPS.push(t);closeNew();openTrip(t);toast('"'+t.title+'"을 만들었어요');
 }
});
/* 앱을 열 때: 여행 중인 여행이나 12시간 안에 보던 여행은 바로 열고, 아니면 목록부터 */
function startTrip(){
 const td=todayIso(),on=TRIPS.find(t=>t.arch!==true&&t.start<=td&&tripState(t).end>=td);
 if(on)return on;
 const last=tripById(LAST.cur);
 return last&&Date.now()-LAST.at<12*36e5?last:null;
}
