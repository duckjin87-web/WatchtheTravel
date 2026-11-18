/* ---------- 백업·복원, 앱 설치 ----------
   백업: 모든 여행과 장소를 파일 하나(JSON 내용)로 저장한다. 서버가 없으므로 이 파일이 유일한 사본이다.
   메일: 휴대폰은 공유창으로 파일을 첨부해 보내고, 안 되면 파일을 저장한 뒤 메일 앱을 연다.
   복원: 백업 파일을 골라 항목마다 확인한 뒤, 같은 여행은 백업 내용으로 바꾸고 없는 여행은 더한다. */
const BKEY='wt.backupAt';
function backupData(){
 const places={};
 const keep=id=>{const q=P[id];if(q&&!places[id])places[id]={n:q.n,c:q.c,lat:q.lat,lng:q.lng,a:q.a,url:q.url};};
 TRIPS.forEach(t=>{t.pool.forEach(keep);t.days.forEach(d=>d.items.forEach(it=>[it.id].concat(it.alts).forEach(keep)));});
 return JSON.stringify({app:'watchthetravel',v:1,at:new Date().toISOString(),trips:TRIPS.map(t=>({id:t.id,title:t.title,start:t.start,arch:t.arch,pool:t.pool,days:t.days})),places});
}
/* 파일 이름은 영문으로: 한글 이름은 일부 브라우저가 무시하고 "download"로 저장한다 */
const backupName=ext=>'travel-planner-backup-'+todayIso().replace(/-/g,'')+'.'+ext;
const markBackup=()=>{try{localStorage.setItem(BKEY,String(Date.now()));}catch(e){}};
function lastBackup(){let t=0;try{t=+localStorage.getItem(BKEY)||0;}catch(e){}if(!t)return'아직 백업한 적이 없어요';const d=new Date(t),n=dayDiff(isoOf(d),todayIso());return '마지막 백업: '+mdw(isoOf(d))+(n>0?' ('+n+'일 전)':' (오늘)');}
function saveFile(text,name){
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function mailBackup(){
 const text=backupData(),f=new File([text],backupName('txt'),{type:'text/plain'});
 if(navigator.canShare&&navigator.canShare({files:[f]})){
  try{await navigator.share({files:[f],title:'여행 플래너 백업',text:'여행 플래너 백업 파일이에요. 앱의 "백업 파일에서 복원"으로 열면 돼요.'});markBackup();renderBackup();return;}
  catch(e){if(e&&e.name==='AbortError')return;}
 }
 saveFile(text,backupName('json'));markBackup();renderBackup();
 location.href='mailto:?subject='+encodeURIComponent('여행 플래너 백업 '+todayIso())+'&body='+encodeURIComponent('방금 저장한 백업 파일('+backupName('json')+')을 이 메일에 첨부해 주세요.\n\n복원하는 법: 여행 플래너 → 내 여행 → 백업·설치 → 백업 파일에서 복원');
 toast('백업 파일을 저장했어요. 메일 앱에서 첨부해 보내세요');
}
/* 받은 파일은 남이 고쳤을 수도 있으므로 공유 링크와 같은 방법(readPayload)으로 여행마다 확인한다 */
function readBackup(o){
 if(!o||o.app!=='watchthetravel'||!Array.isArray(o.trips))throw new Error('bad');
 const out=[];
 o.trips.slice(0,200).forEach(t=>{try{
  const x=readPayload({v:1,t,p:o.places||{}});delete x.shared;
  if(typeof t.id==='string'&&/^[\w-]{1,40}$/.test(t.id))x.id=t.id;
  if(typeof t.arch==='boolean')x.arch=t.arch;
  out.push(x);
 }catch(e){}});
 if(!out.length)throw new Error('empty');
 return out;
}
let pend=null; /* 복원 전 확인 중인 여행들 */
function applyRestore(L){
 let rep=0;
 L.forEach(x=>{const k=TRIPS.findIndex(t=>t.id===x.id);if(k>-1){if(TRIPS[k]===trip)trip=x;TRIPS[k]=x;rep++;}else TRIPS.push(x);});
 saveTrip();return rep;
}

/* ---------- 앱 설치 ---------- */
let bip=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();bip=e;if(home.classList.contains('on'))renderHome();});
window.addEventListener('appinstalled',()=>{bip=null;toast('앱으로 설치했어요. 홈 화면에서 열 수 있어요');});
function installHtml(){
 if(standalone())return '<p class="sub" style="margin:0">'+ic('check',14)+' 앱으로 설치되어 있어요.</p>';
 if(bip)return '<button class="btn-main" data-bk="install">'+ic('plus',16)+' 홈 화면에 앱으로 설치</button>';
 if(isIOS())return '<p class="sub" style="margin:0">Safari 아래쪽 <b>공유 버튼</b>(네모에 위 화살표) → <b>홈 화면에 추가</b>를 누르면 앱처럼 설치돼요.</p>';
 return '<p class="sub" style="margin:0">브라우저 메뉴(⋮)에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르면 앱처럼 설치돼요.</p>';
}

/* ---------- 백업·설치 창 ---------- */
function renderBackup(){
 let h='<div class="shd" data-bk="x"></div><div class="shp" role="dialog" aria-label="백업과 앱 설치"><div class="nh"><button class="ib" data-bk="x" aria-label="닫기">'+ic('x')+'</button><b>백업·앱 설치</b></div>';
 if(pend){
  const rep=pend.filter(x=>TRIPS.some(t=>t.id===x.id)).length;
  h+='<p style="margin:0;font-size:15px"><b>여행 '+pend.length+'개</b>를 복원할까요?</p><p class="sub" style="margin:0">'+pend.slice(0,5).map(x=>x.title).join(', ')+(pend.length>5?' 외 '+(pend.length-5)+'개':'')+'</p>'
   +(rep?'<p class="sub" style="margin:0;color:#B4441F">이미 있는 여행 '+rep+'개는 백업 파일 내용으로 바뀌어요.</p>':'')
   +'<button class="btn-main" data-bk="apply">복원하기</button><button class="chip big" data-bk="cancel">취소</button></div>';
 }else{
  h+='<div class="bsec"><b>백업</b><p class="sub" style="margin:0">여행은 이 휴대폰 안에만 저장돼요. 휴대폰을 바꾸거나 브라우저 기록을 지우기 전에 백업해 두세요. '+lastBackup()+'</p>'
   +'<button class="btn-main" data-bk="save">'+ic('down',16)+' 백업 파일 저장</button><button class="chip big" data-bk="mail">'+ic('share',16)+' 메일로 보내기</button></div>'
   +'<div class="bsec"><b>복원</b><p class="sub" style="margin:0">저장해 둔 백업 파일을 고르면 여행을 되살려요.</p><button class="chip big" data-bk="pick">'+ic('up',16)+' 백업 파일에서 복원</button><input type="file" id="bk-file" accept=".json,.txt,application/json,text/plain" hidden></div>'
   +'<div class="bsec"><b>앱으로 설치</b>'+installHtml()+'</div></div>';
 }
 shb.innerHTML=h;
}
function openBackup(){pend=null;renderBackup();shb.classList.add('on');}
shb.addEventListener('click',async e=>{
 const b=e.target.closest('[data-bk]');if(!b)return;const a=b.dataset.bk;
 if(a==='x'){pend=null;closeShare();return;}
 if(a==='save'){saveFile(backupData(),backupName('json'));markBackup();renderBackup();toast('백업 파일을 저장했어요');return;}
 if(a==='mail'){await mailBackup();return;}
 if(a==='pick'){$('#bk-file').click();return;}
 if(a==='cancel'){pend=null;renderBackup();return;}
 if(a==='apply'){const n=pend.length,rep=applyRestore(pend);pend=null;closeShare();renderHome();toast('여행 '+n+'개를 복원했어요'+(rep?' ('+rep+'개는 백업 내용으로 바뀜)':''));return;}
 if(a==='install'&&bip){bip.prompt();const r=await bip.userChoice;bip=null;renderBackup();if(r&&r.outcome==='accepted')toast('앱으로 설치하고 있어요');}
});
shb.addEventListener('change',e=>{
 if(e.target.id!=='bk-file'||!e.target.files[0])return;
 const f=e.target.files[0];
 if(f.size>5e6){toast('파일이 너무 커요. 여행 플래너 백업 파일인지 확인해 주세요');return;}
 f.text().then(s=>{pend=readBackup(JSON.parse(s));renderBackup();})
  .catch(()=>toast('여행 플래너 백업 파일이 아니거나 손상됐어요'));
});
home.addEventListener('click',e=>{if(e.target.closest('[data-hs]'))openBackup();});
