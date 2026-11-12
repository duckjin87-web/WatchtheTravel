/* ---------- 공유 ----------
   서버 없이 여행을 링크 하나에 담는다: JSON -> deflate 압축 -> base64url -> 주소의 #s= 뒤.
   받은 사람은 링크를 열어 일정과 지도를 보고, 자기 여행 목록에 저장할 수 있다.
   링크는 보낸 순간의 사본이라, 그 뒤 고친 내용은 서로 반영되지 않는다. */
const b64u=u8=>{let s='';for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=s=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/'));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
async function pack(o){
 const s=JSON.stringify(o);
 if(window.CompressionStream){const st=new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));return '1.'+b64u(new Uint8Array(await new Response(st).arrayBuffer()));}
 return '0.'+b64u(new TextEncoder().encode(s));
}
async function unpack(str){
 const u=unb64u(str.slice(2));
 if(str[0]==='1'){const st=new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return JSON.parse(await new Response(st).text());}
 return JSON.parse(new TextDecoder().decode(u));
}
function tripPayload(t){
 const p={};
 const keep=id=>{const q=P[id];if(q&&!p[id])p[id]={n:q.n,c:q.c,lat:q.lat,lng:q.lng,a:q.a,url:q.url};};
 t.pool.forEach(keep);t.days.forEach(d=>d.items.forEach(it=>[it.id].concat(it.alts).forEach(keep)));
 return{v:1,t:{title:t.title,start:t.start,pool:t.pool,days:t.days},p};
}
async function shareUrl(t){return location.origin+location.pathname+'#s='+await pack(tripPayload(t));}

/* 받은 데이터는 남이 만든 것이므로 글자·숫자·형식을 하나씩 확인해서 옮긴다 */
const okUrl=u=>typeof u==='string'&&/^https:\/\/(place\.)?map\.kakao\.com\//.test(u)?u:undefined;
function readPayload(o){
 if(!o||o.v!==1||!o.t||!Array.isArray(o.t.days)||!o.t.days.length)throw new Error('bad');
 Object.keys(o.p||{}).forEach(id=>{
  const q=o.p[id];if(!/^[\w.-]{1,40}$/.test(id)||P[id]||!q||typeof q.lat!=='number'||typeof q.lng!=='number')return;
  const c=CATS.indexOf(q.c)>-1?q.c:'명소';
  const p=Object.assign({id,n:clean(q.n).slice(0,60)||'이름 없는 장소',c,lat:q.lat,lng:q.lng,a:clean(q.a).slice(0,80),url:okUrl(q.url),r:null,v:null,src:'카카오'},KM?proj(q.lat,q.lng):llToXY(q.lat,q.lng));
  DB.push(p);P[id]=p;
 });
 const ok=id=>typeof id==='string'&&P[id]&&(!KM||P[id].lat!=null);
 const days=o.t.days.slice(0,30).map(d=>({start:/^\d\d:\d\d$/.test(d&&d.start)?d.start:'09:00',
  items:((d&&d.items)||[]).filter(it=>it&&ok(it.id)).slice(0,60).map(it=>({id:it.id,stay:Math.max(30,Math.min(720,+it.stay||60)),mode:it.mode==='walk'?'walk':'car',alts:(Array.isArray(it.alts)?it.alts:[]).filter(ok).slice(0,10)}))}));
 return{id:'s'+Date.now().toString(36),title:clean(o.t.title).slice(0,40)||'공유받은 여행',start:/^\d{4}-\d\d-\d\d$/.test(o.t.start)?o.t.start:todayIso(),pool:(Array.isArray(o.t.pool)?o.t.pool:[]).filter(ok).slice(0,100),days,shared:true};
}

/* 일정 글: 메신저에 붙여 넣기 좋게 */
function tripText(t){
 const keep=trip;trip=t;
 let s='['+t.title+'] '+mdw(t.start)+(t.days.length>1?' – '+mdw(addDays(t.start,t.days.length-1)):'')+' · '+nights(t.days.length)+'\n';
 t.days.forEach((d,i)=>{
  s+='\n■ '+(i+1)+'일차 '+dlabel(i)+'\n';
  const rows=sched(i);if(!rows.length)s+='(일정 없음)\n';
  rows.forEach(r=>{s+=hm(r.arr)+'–'+hm(r.dep)+' '+r.p.n+' ('+r.p.c+')\n';if(r.s)s+='   ↓ '+(r.s.walk?'도보 ':'차 ')+dur(r.dm)+' · '+fmtD(r.km)+'\n';});
 });
 if(t.pool.length)s+='\n후보: '+t.pool.map(id=>P[id].n).join(', ')+'\n';
 trip=keep;return s;
}

/* ---------- 공유 창 ---------- */
const shb=$('#sharebox');
function openShare(){
 if(TRIPS.indexOf(trip)<0){toast('먼저 내 여행에 저장한 다음 공유할 수 있어요');return;}
 saveTrip();
 const n=trip.days.reduce((a,d)=>a+d.items.length,0);
 shb.innerHTML='<div class="shd" data-sh="x"></div><div class="shp" role="dialog" aria-label="일정 공유"><div class="nh"><button class="ib" data-sh="x" aria-label="닫기">'+ic('x')+'</button><b>일정 공유</b></div>'
  +'<p class="sub" style="margin:0">'+trip.title+' · '+mdw(trip.start)+' · '+nights(trip.days.length)+' · '+n+'곳</p>'
  +'<button class="btn-main" data-sh="link">'+ic('share',16)+' 링크 보내기</button>'
  +'<button class="chip big" data-sh="text">'+ic('list',16)+' 일정 글로 보내기</button>'
  +'<p class="sub" style="margin:0">링크를 받은 사람은 지도와 일정을 그대로 보고 자기 여행 목록에 저장할 수 있어요. 지금 모습을 담은 사본이라, 보낸 뒤에 고친 내용은 반영되지 않아요.</p>'
  +'<div id="shout"></div></div>';
 shb.classList.add('on');
}
function closeShare(){shb.classList.remove('on');}
/* 휴대폰 공유창(카카오톡 등) -> 안 되면 복사 -> 그것도 안 되면 직접 복사할 칸을 보여준다 */
async function sendOut(title,text,url){
 const data=url?{title,text,url}:{title,text};
 if(navigator.share){try{await navigator.share(data);return;}catch(e){if(e&&e.name==='AbortError')return;}}
 const body=url?text+'\n'+url:text;
 try{await navigator.clipboard.writeText(body);toast(url?'링크를 복사했어요. 메신저에 붙여 넣으세요':'일정 글을 복사했어요');return;}catch(e){}
 $('#shout').innerHTML='<p class="sub" style="margin:0">아래 내용을 길게 눌러 복사하세요.</p><textarea readonly rows="4">'+body.replace(/</g,'&lt;')+'</textarea>';
 const ta=$('#shout textarea');ta.focus();ta.select();
}
shb.addEventListener('click',async e=>{
 const b=e.target.closest('[data-sh]');if(!b)return;const a=b.dataset.sh;
 if(a==='x'){closeShare();return;}
 if(a==='link'){b.disabled=true;try{await sendOut(trip.title,'['+trip.title+'] 여행 일정이에요. 링크를 열면 지도와 일정을 볼 수 있어요.',await shareUrl(trip));}finally{b.disabled=false;}return;}
 if(a==='text'){await sendOut(trip.title,tripText(trip)+'\n지도와 함께 보기: '+await shareUrl(trip));}
});
$('#share-btn').addEventListener('click',openShare);

/* ---------- 공유받은 여행 ---------- */
let incoming=null;
async function openIncoming(){
 const h=location.hash.slice(3);
 try{incoming=readPayload(await unpack(decodeURIComponent(h)));}
 catch(e){history.replaceState(null,'',location.pathname);toast('공유 링크를 읽지 못했어요. 링크가 잘렸는지 확인해 주세요');openHome();return;}
 const t=incoming,n=t.days.reduce((a,d)=>a+d.items.length,0);
 home.innerHTML='<div class="hh"><h1>공유받은 여행</h1></div><div class="hl">'
  +'<div class="tcard"><div class="tc-map">'+thumb(t)+'</div><div class="tc-body"><div><div class="nm">'+t.title+'</div><div class="sub">'+md(t.start)+' – '+md(addDays(t.start,t.days.length-1))+' · '+nights(t.days.length)+' · '+n+'곳'+(t.pool.length?' · 후보 '+t.pool.length+'곳':'')+'</div></div></div></div>'
  +'<button class="btn-main" data-in="save">내 여행에 저장</button><button class="chip big" data-in="view">저장하지 않고 보기</button><button class="chip big" data-in="home">내 여행 목록으로</button></div>';
 home.classList.add('on');
}
function saveIncoming(t){
 delete t.shared;t.id='t'+Date.now().toString(36);TRIPS.push(t);incoming=null;
 history.replaceState(null,'',location.pathname);
}
home.addEventListener('click',e=>{
 const b=e.target.closest('[data-in]');if(!b||!incoming)return;e.stopImmediatePropagation();const a=b.dataset.in,t=incoming;
 if(a==='save'){saveIncoming(t);openTrip(t);toast('"'+t.title+'"을 내 여행에 저장했어요');return;}
 if(a==='view'){openTrip(t);return;}
 if(a==='home'){incoming=null;history.replaceState(null,'',location.pathname);openHome();}
},true);
/* 저장하지 않고 보는 중이면 시트 위에 안내와 저장 버튼 */
function renderShnote(){
 const el=$('#shnote'),on=!!trip.shared&&TRIPS.indexOf(trip)<0;
 el.style.display=on?'flex':'none';
 if(on)el.innerHTML='<span>공유받은 일정이에요. 저장하기 전에는 고친 내용이 남지 않아요.</span><button class="chip" data-sv="1">내 여행에 저장</button>';
}
$('#shnote').addEventListener('click',e=>{if(!e.target.closest('[data-sv]'))return;saveIncoming(trip);toast('"'+trip.title+'"을 내 여행에 저장했어요');renderAll();});
