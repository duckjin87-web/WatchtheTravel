
const COL=['#E2603A','#1F8A70','#6B5BD2','#C98A1B','#2F7FC1'];

/* 예시 데이터: x,y는 도식 지도용 km 좌표, lat/lng는 카카오 모드용 실제 위경도(근사값), 평점은 샘플 값.
   맛집·카페 샘플은 도식 모드 전용이고, 카카오 모드에서는 카카오 로컬 검색 결과로 대체된다 */
const DB=[];
const add=(n,c,x,y,o)=>{const id='p'+DB.length;DB.push(Object.assign({id,n,c,x,y},o||{}));return id;};
const S={
 air:add('제주공항','명소',22,8,{stay:30,lat:33.507,lng:126.4929}),
 ham:add('함덕해수욕장','명소',47,6,{lat:33.5434,lng:126.6697}),
 man:add('만장굴','명소',60,8,{lat:33.5284,lng:126.7716}),
 sung:add('성산일출봉','명소',77,16,{stay:90,lat:33.4581,lng:126.9425}),
 sup:add('섭지코지','명소',74,20,{lat:33.424,lng:126.931}),
 hyup:add('협재해수욕장','명소',11,15,{lat:33.394,lng:126.2397}),
 osul:add('오설록 티뮤지엄','명소',23,24,{lat:33.3059,lng:126.2894}),
 jung:add('중문 주상절리','명소',36,31,{lat:33.2377,lng:126.4253}),
 chun:add('천지연폭포','명소',47,32,{lat:33.247,lng:126.5594}),
 yong:add('용두암','명소',25,7,{stay:30,lat:33.5157,lng:126.512}),
 dong:add('동문시장','명소',26,9,{lat:33.5118,lng:126.5276}),
 arbo:add('한라수목원','명소',30,14,{lat:33.47,lng:126.493})
};
add('카멜리아힐','명소',22,26,{lat:33.2896,lng:126.3697});add('산방산','명소',22,32,{lat:33.2393,lng:126.3121});add('쇠소깍','명소',53,32,{lat:33.2523,lng:126.6234});add('비자림','명소',62,13,{lat:33.4904,lng:126.809});add('사려니숲길','명소',46,17,{lat:33.4229,lng:126.6302});
const E=(n,c,x,y,r,v,s)=>add(n,c,x,y,{r,v,src:s||'카카오'});
E('일출봉 앞 호떡','음식점',76.8,15.5,3.8,52);E('성산 돌담식당','음식점',75.5,14.8,4.2,311);E('섭지 카페','카페',74.3,19.6,4.0,64);
E('섭지국수','음식점',73,19.4,4.1,86);E('해녀의부엌','음식점',76.6,18,4.3,128);E('바다마루','카페',72.5,21.2,4.4,203);
E('오조 로스터스','카페',78,13,3.9,54);E('일출 흑돼지','음식점',70.5,15.5,3.6,97);E('우도행 선착장 분식','음식점',79,16.8,3.3,41);
E('성산 갈치조림','음식점',67,13,4.0,75);E('광치 커피랩','카페',74.5,13.5,4.2,67);
E('함덕 해변 카페','카페',46.7,6.6,4.2,188);E('서우봉 카페','카페',46,5.5,4.5,412);E('함덕 고기국수','음식점',48.5,7.5,4.0,156);
E('조천 해물뚝배기','음식점',43,7.5,3.8,63);E('북촌 돌집 카페','카페',52,7,4.1,88);
E('김녕 해녀식당','음식점',57,6,4.3,190);E('김녕 바다커피','카페',55.5,5.5,4.2,141);
E('용담 해안 카페','카페',24,6.2,4.3,320);E('동문시장 야시장 분식','음식점',26.2,9.3,4.1,233);E('동문 순대국','음식점',26.5,9.8,4.0,244);
E('제주 몸국집','음식점',25,10.5,4.4,380);E('공항 앞 우동집','음식점',21.2,9,3.4,120);E('탑동 로스터리','카페',24.5,7.6,4.1,99);
E('도두 횟집','음식점',19,7.5,3.9,72);E('연동 브런치','카페',30,11,4.2,130);
E('노형 갈비','음식점',28,13,3.9,110);E('수목원 찻집','카페',31,15,4.0,52);
E('협재 앞 카페','카페',11.5,14.2,4.5,530);E('한림 칼국수','음식점',13.5,16.5,4.1,220);E('금능 포구 횟집','음식점',9.5,13.5,3.7,66);
E('서광 녹차 카페','카페',22.5,23,4.2,305);E('안덕 흑돼지','음식점',25,25.5,3.9,140);
E('중문 해물탕','음식점',35,32.5,4.0,88);E('색달 카페','카페',37.5,30,4.3,210);
E('서귀포 올레시장 국수','음식점',46,33.5,4.2,460);E('이중섭 거리 카페','카페',45.5,32.5,4.4,270);E('칠십리 갈치구이','음식점',49,33,4.1,175);
E('성산 해녀촌','음식점',75,17.2,null,null,'네이버');E('섭지 오름 카페','카페',73.6,20.6,null,null,'네이버');E('함덕 몰질국수','음식점',47.8,6.4,null,null,'네이버');
E('동문 재래 순대','음식점',25.6,9.6,null,null,'네이버');E('협재 해물라면','음식점',12,15.4,null,null,'네이버');E('중문 전복죽집','음식점',36.4,31.6,null,null,'네이버');
E('천지연 앞 찻집','카페',46.5,31.4,null,null,'네이버');E('한림 바다 베이커리','카페',12.8,14.6,null,null,'네이버');E('오설록 근처 흑돼지','음식점',23.6,24.8,null,null,'네이버');E('용두암 해물칼국수','음식점',24.6,7.8,null,null,'네이버');
E('성산 바다 호텔','숙소',75.8,15.2,4.3,210);E('함덕 오션 스테이','숙소',46.2,6.9,4.1,95);E('중문 리조트','숙소',36.8,30.8,4.5,640);
E('제주시 게스트하우스','숙소',25.4,8.8,4.0,77);E('협재 바다 펜션','숙소',12.4,15.8,4.2,133);
['해녀의부엌','제주 몸국집','협재 앞 카페','함덕 해변 카페','이중섭 거리 카페'].forEach(n=>{const p=DB.find(x=>x.n===n);if(p)p.src='카카오·네이버';});
const P=Object.fromEntries(DB.map(p=>[p.id,p]));
const defStay=()=>60;
const item=id=>({id,stay:defStay(P[id]),mode:'car',alts:[]});
const mk=ids=>ids.map(item);

const trip={start:'2026-10-24',days:[
 {start:'09:00',items:mk([S.air,S.ham,S.man,S.sung,S.sup])},
 {start:'09:30',items:mk([S.hyup,S.osul,S.jung,S.chun])},
 {start:'10:00',items:mk([S.yong,S.dong,S.arbo,S.air])}
]};
let sd=0,all=false,ahi=null,sel=null,nb={r:3,t:'전체',s:'전체',min:0,hi:null},sq='',scat='전체',pg=null,me=null,dpend=-1,gmsg='';

/* 저장: 바뀔 때마다 이 브라우저(localStorage)에 저장한다. 계정·여러 기기 저장은 예정 */
const SKEY='wt.trip.v1';
function saveTrip(){
 try{
  const ids=new Set();trip.days.forEach(d=>d.items.forEach(it=>{ids.add(it.id);it.alts.forEach(a=>ids.add(a));}));
  const places={};ids.forEach(id=>{const p=P[id];places[id]={id,n:p.n,c:p.c,lat:p.lat,lng:p.lng,a:p.a,url:p.url,src:p.src};});
  localStorage.setItem(SKEY,JSON.stringify({title:$('#title').value,start:trip.start,days:trip.days,places}));
 }catch(e){}
}
function loadTrip(){
 let s=null;try{s=JSON.parse(localStorage.getItem(SKEY));}catch(e){}
 if(!s||!Array.isArray(s.days)||!s.days.length)return;
 Object.values(s.places||{}).forEach(q=>{
  if(P[q.id]){if(CATS.indexOf(q.c)>-1)P[q.id].c=q.c;return;}
  if(q.lat==null)return;
  const p=Object.assign({r:null,v:null,src:'카카오'},q,KM?proj(q.lat,q.lng):llToXY(q.lat,q.lng));DB.push(p);P[p.id]=p;
 });
 const ok=id=>P[id]&&(!KM||P[id].lat!=null);
 trip.start=s.start||trip.start;
 trip.days=s.days.map(d=>({start:d.start||'09:00',items:(d.items||[]).filter(it=>ok(it.id)).map(it=>({id:it.id,stay:it.stay||60,mode:it.mode==='walk'?'walk':'car',alts:(it.alts||[]).filter(ok)}))}));
 if(s.title)$('#title').value=s.title;
 $('#dstart').value=trip.start;
}
