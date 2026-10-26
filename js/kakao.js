/* ---------- 카카오맵 어댑터 (CONFIG.USE_MOCK=false) ----------
   지도, 경로선, 마커, 반경 원을 카카오맵으로 그리고 장소 검색·근처 음식점·카페·숙소를 카카오 로컬(services)로 가져온다.
   일정 계산과 GPS는 그대로 km 평면 좌표(x,y)를 쓰고, 그릴 때만 위경도로 바꾼다 (core.js proj/unproj). */
function loadKakao(){
 return new Promise((ok,no)=>{
  const k=CONFIG.KAKAO_JS_KEY;if(!k)return no(new Error('CONFIG.KAKAO_JS_KEY가 비어 있음'));
  const s=document.createElement('script');
  s.src='https://dapi.kakao.com/v2/maps/sdk.js?appkey='+encodeURIComponent(k)+'&autoload=false&libraries=services';
  s.onload=()=>window.kakao&&kakao.maps?kakao.maps.load(ok):no(new Error('카카오맵 SDK 초기화 실패'));
  s.onerror=()=>no(new Error('카카오맵 SDK 로드 실패 (키, 도메인 등록 확인)'));
  document.head.appendChild(s);
 });
}
const clean=s=>String(s||'').replace(/[<>"]/g,'');
const kakaoUrl=p=>p.url||'https://map.kakao.com/link/map/'+encodeURIComponent(p.n)+','+p.lat+','+p.lng;

function kakaoMap(){
 const K=kakao.maps,OK=K.services.Status.OK,ERR=K.services.Status.ERROR,el=$('#kmap');
 /* 위경도가 있는 장소만 쓰고, 기준점을 그 중심으로 옮겨 km 좌표를 다시 만든다 */
 const geo=DB.filter(p=>p.lat!=null);
 if(geo.length){GEO.lat=geo.reduce((a,p)=>a+p.lat,0)/geo.length;GEO.lng=geo.reduce((a,p)=>a+p.lng,0)/geo.length;}
 GEO.kx=111.32*Math.cos(GEO.lat*Math.PI/180);
 geo.forEach(p=>Object.assign(p,proj(p.lat,p.lng)));
 map.style.display='none';el.hidden=false;
 const km=new K.Map(el,{center:new K.LatLng(GEO.lat,GEO.lng),level:10});
 const ps=new K.services.Places();
 const pos=p=>{const g=p.lat!=null?p:unproj(p.x,p.y);return new K.LatLng(g.lat,g.lng);};

 function reg(d){
  const id='k'+d.id;if(P[id])return P[id];
  const lat=+d.y,lng=+d.x;
  const p=Object.assign({id,n:clean(d.place_name),c:catOf(d.category_group_code,d.category_name),lat,lng,
   a:clean(d.road_address_name||d.address_name),r:null,v:null,src:'카카오',url:d.place_url},proj(lat,lng));
  DB.push(p);P[id]=p;return p;
 }

 /* ---- 그리기: 상태가 바뀔 때마다 오버레이를 다시 만든다 (프레임당 한 번) ---- */
 let ov=[],q=0;
 const put=o=>{o.setMap(km);ov.push(o);return o;};
 const node=(h,fn)=>{const d=document.createElement('div');d.innerHTML=h;const e=d.firstChild;
  if(fn)e.addEventListener('click',ev=>{ev.stopPropagation();fn();});return e;};
 const pin=(p,h,z,fn)=>put(new K.CustomOverlay({position:pos(p),content:node(h,fn),xAnchor:.5,yAnchor:.5,zIndex:z,clickable:!!fn}));
 const line=(pts,o)=>put(new K.Polyline(Object.assign({path:pts.map(pos)},o)));
 function draw(){if(!q)q=requestAnimationFrame(render);}
 function render(){
  q=0;ov.forEach(o=>o.setMap(null));ov=[];
  const sc=scene(),pj=km.getProjection();
  sc.lines.forEach(l=>{
   if(l.halo)line(l.pts,{strokeWeight:l.w+3.5,strokeColor:'#fff',strokeOpacity:l.op===1?.9:.5,zIndex:l.z});
   line(l.pts,{strokeWeight:l.w,strokeColor:l.c,strokeOpacity:l.op,strokeStyle:l.dash?'shortdash':'solid',zIndex:l.z});
  });
  if(sc.circle)put(new K.Circle({center:pos(sc.circle.p),radius:sc.circle.r*1000,strokeWeight:1.2,strokeColor:'#14181D',strokeOpacity:.8,strokeStyle:'dash',fillColor:'#14181D',fillOpacity:.05}));
  sc.marks.forEach(m=>{
   if(m.need){const A=pj.containerPointFromCoords(pos(m.need[0])),B=pj.containerPointFromCoords(pos(m.need[1]));if(Math.hypot(A.x-B.x,A.y-B.y)<56)return;}
   pin(m.p,m.h,m.z,m.click);
  });
 }
 K.event.addListener(km,'idle',draw);

 /* 바텀시트에 가리지 않도록 아래쪽 여백을 시트 높이만큼 준다 */
 function fit(pts,extra){
  km.relayout();extra=extra||(pts.length===1?.5:0);
  if(!pts.length)pts=trip.days.flatMap((_,i)=>dayPts(i));
  if(!pts.length){km.setCenter(new K.LatLng(GEO.lat,GEO.lng));km.setLevel(10);return;}
  const b=new K.LatLngBounds();
  pts.forEach(p=>{b.extend(pos({x:p.x-extra,y:p.y-extra}));b.extend(pos({x:p.x+extra,y:p.y+extra}));});
  km.setBounds(b,72,28,sheetH+24,28);
 }

 /* ---- 근처 음식점(FD6)·카페(CE7)·숙소(AD5): 장소+반경별로 캐시 ---- */
 const nc={};
 function near(a){
  const k=a.id+'|'+nb.r;
  if(!nc[k]){
   const e=nc[k]={busy:true,err:false,list:[]};let n=3;
   ['FD6','CE7','AD5'].forEach(code=>ps.categorySearch(code,(d,st)=>{
    if(st===OK)d.forEach(x=>e.list.push(reg(x)));else if(st===ERR)e.err=true;
    if(--n===0){e.busy=false;renderList();draw();}
   },{location:pos(a),radius:Math.min(20000,nb.r*1000),sort:K.services.SortBy.DISTANCE}));
  }
  return nc[k];
 }

 /* ---- 키워드 검색: 입력이 멈추면 호출, 검색어+분류별 캐시 ---- */
 const sc={},CAT={'명소':'AT4','음식점':'FD6','카페':'CE7','숙소':'AD5'};let st=0,pk=null;
 function search(qs,cat){
  const k=qs+'|'+cat,c=sc[k];if(c)return c.busy?null:c;
  if(pk)delete sc[pk];clearTimeout(st);
  sc[k]={busy:true};pk=k;
  st=setTimeout(()=>{
   pk=null;
   ps.keywordSearch(qs,(d,s)=>{
    sc[k]={busy:false,err:s===ERR,list:s===OK?d.map(reg):[]};
    if($('#search').classList.contains('on'))renderSearch();
   },CAT[cat]?{category_group_code:CAT[cat]}:{});
  },250);
  return null;
 }

 return{draw,fit,near,search};
}
