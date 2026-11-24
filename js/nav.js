/* ---------- 뒤로 가기 ----------
   화면이 한 장이라 브라우저 기록이 없으면 휴대폰 뒤로(안드로이드 버튼, 아이폰 뒤로 밀기)에 앱이 바로 닫힌다.
   메인(내 여행 목록)이 아닌 동안에는 기록을 한 칸(guard) 쌓아 두고, 뒤로가 오면 위에 열린 것부터 하나씩 닫는다.
   메인에 돌아오면 그 한 칸을 치워서, 메인에서 뒤로를 누르면 앱이 닫힌다. */
const isOn=el=>el.classList.contains('on');
const atRoot=()=>isOn(home)&&!isOn(shb)&&!isOn(nf)&&!isOn($('#search'))&&!isOn(cbox);
let guard=false,skipPop=false,gq=0;
function syncGuard(){
 if(gq)return;
 gq=setTimeout(()=>{
  gq=0;
  if(!atRoot()&&!guard){history.pushState({wt:1},'');guard=true;}
  else if(atRoot()&&guard){guard=false;skipPop=true;history.back();}
 },0);
}
/* 뒤로 한 번에 한 단계 */
function backStep(){
 if(isOn(cbox)){closeCand();return;}
 if(isOn(shb)){pend=null;closeShare();return;}
 if(isOn(nf)){closeNew();return;}
 if(isOn($('#search'))){closeSearch();return;}
 if(isOn(home))return;
 if(prev){const b=ordbar.querySelector('[data-o="cancel"]');if(b)b.click();return;}
 if(ord){ord=null;refit();renderAll();return;}
 if(!$('#head-edit').hidden){editHead(false);return;}
 if(sel!=null){sel=null;nb.hi=null;ahi=null;refit();renderAll();return;}
 saveTrip();openHome();
}
window.addEventListener('popstate',()=>{
 guard=false;
 if(skipPop){skipPop=false;return;}
 backStep();syncGuard();
});
/* 겹쳐 뜨는 화면이 열리고 닫힐 때마다 기록 칸을 맞춘다 */
const mo=new MutationObserver(syncGuard);
[home,shb,nf,$('#search'),cbox].forEach(el=>mo.observe(el,{attributes:true,attributeFilter:['class']}));
