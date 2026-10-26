/* ---------- 자동차 도로 경로 ----------
   카카오 모드에서 구간마다 api/kakao-directions(카카오모빌리티 길찾기)를 불러 소요시간·거리·도로 좌표를 캐시한다.
   결과가 오기 전이나 실패하면 null -> core.js seg()가 직선거리 추정으로 대신한다. */
const RKEY='wt.routes.v1';
let RC=null,rq=0,rwarn=false;
function route(a,b){
 if(!KM||a.lat==null||b.lat==null)return null;
 if(!RC){RC={};try{const s=JSON.parse(localStorage.getItem(RKEY))||{};Object.keys(s).forEach(k=>{RC[k]=routeOf(s[k]);});}catch(e){}}
 const k=a.lat.toFixed(5)+','+a.lng.toFixed(5)+'>'+b.lat.toFixed(5)+','+b.lng.toFixed(5),c=RC[k];
 if(c)return c.ok?c:null;
 RC[k]={};
 fetch(CONFIG.API_BASE+'/api/kakao-directions?origin='+b2(a)+'&destination='+b2(b))
  .then(r=>r.ok?r.json():Promise.reject(r.status))
  .then(j=>{const raw={sec:j.sec,m:j.m,path:[[a.lng,a.lat]].concat(j.path,[[b.lng,b.lat]])};RC[k]=routeOf(raw);routeKeep(k,raw);routeDone();})
  .catch(e=>{RC[k]={fail:true};if(!rwarn&&e!==404){rwarn=true;toast('자동차 경로를 불러오지 못해 직선거리로 추정해요');}});
 return null;
}
const b2=p=>p.lng.toFixed(6)+','+p.lat.toFixed(6);
const routeOf=j=>({ok:true,km:j.m/1000,min:Math.max(1,Math.round(j.sec/60)),path:j.path.map(q=>proj(q[1],q[0]))});
function routeKeep(k,raw){
 try{const s=JSON.parse(localStorage.getItem(RKEY))||{},ks=Object.keys(s);if(ks.length>200)delete s[ks[0]];s[k]=raw;localStorage.setItem(RKEY,JSON.stringify(s));}catch(e){}
}
/* 여러 구간이 연달아 도착하므로 모아서 한 번 다시 그린다. 순서를 끄는 중이면 끝난 뒤로 미룬다 */
function routeDone(){clearTimeout(rq);rq=setTimeout(()=>{if(drag)routeDone();else renderAll();},80);}
