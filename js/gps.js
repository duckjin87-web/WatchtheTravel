/* ---------- 내 위치 ---------- */
let sim=null,watch=null,firstFix=true;
const llToXY=(la,lo)=>({x:4+(lo-126.15)/.8*82,y:3.5+(33.57-la)/.37*34});
/* 진행 위치: 각 구간의 실제 경로선(도로 좌표 또는 직선)에서 가장 가까운 점을 찾는다 */
function prog(){
 if(!me)return null;const rows=sched(sd);if(!rows.length)return null;
 let nr=0,nd=1e9;rows.forEach((r,k)=>{const d=dist(me,r.p);if(d<nd){nd=d;nr=k;}});
 if(rows.length===1)return{i:0,t:0,d:nd,px:rows[0].p.x,py:rows[0].p.y,near:0,nd:nd,passed:nd<.4?1:0};
 let best=null;
 rows.forEach((r,i)=>{
  if(!r.s)return;const L=r.s.path,tot=plen(L)||1;let acc=0;
  for(let j=1;j<L.length;j++){
   const a=L[j-1],b=L[j],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,sl=Math.sqrt(l2);
   const t=l2?Math.max(0,Math.min(1,((me.x-a.x)*dx+(me.y-a.y)*dy)/l2)):0,px=a.x+dx*t,py=a.y+dy*t,d=Math.hypot(me.x-px,me.y-py);
   if(!best||d<best.d)best={i:i,t:(acc+sl*t)/tot,d:d,px:px,py:py};
   acc+=sl;
  }
 });
 best.near=nr;best.nd=nd;best.passed=best.i+(best.t>.98?2:(best.t>.02?1:0));
 return best;
}
function delayMin(rows){
 if(!pg||!me||rows.length<2)return null;
 const r=rows[Math.min(pg.i,rows.length-2)],planned=r.dep+pg.t*r.dm;
 if(me.src==='sim')return sim?sim.late:0;
 const d=new Date(trip.start+'T00:00:00');d.setDate(d.getDate()+sd);const n=new Date();
 if(d.toDateString()!==n.toDateString())return null;
 return Math.round(n.getHours()*60+n.getMinutes()-planned);
}
function renderG(){
 const el=$('#gstat');
 if(!me&&!gmsg){el.innerHTML='';el.style.display='none';return;}
 el.style.display='flex';
 if(!me){el.innerHTML='<span>'+gmsg+'</span><button class="chip" data-g="sim">이동 시뮬레이션 보기</button>';return;}
 const rows=sched(sd);let t='',warn=false;
 if(!pg||!rows.length)t='이 날 일정에 방문지가 없어요';
 else if(rows.length===1)t=pg.nd<.4?'1번 '+rows[0].p.n+' 도착':'1번까지 '+fmtD(pg.nd);
 else{
  if(pg.nd<.4)t=(pg.near+1)+'번 '+rows[pg.near].p.n+' 도착';
  else t=(pg.i+1)+'번 → '+(pg.i+2)+'번 '+rows[pg.i+1].p.n+' 구간 · '+Math.round(pg.t*100)+'%';
  if(pg.d>1.5){t+=' · 경로에서 '+fmtD(pg.d)+' 이탈';warn=true;}
  const dl=delayMin(rows);
  if(dl!=null){t+=' · '+(Math.abs(dl)<5?'일정대로':(dl>0?dl+'분 늦음':(-dl)+'분 빠름'));if(dl>=15)warn=true;}
 }
 el.innerHTML='<span style="'+(warn?'color:#D6452B':'')+'">'+t+'</span><button class="chip" data-g="stop">'+(me.src==='sim'?'시뮬레이션 중지':'위치 끄기')+'</button>';
}
function stopAll(){
 if(watch!=null){navigator.geolocation.clearWatch(watch);watch=null;}
 if(sim&&sim.id)clearInterval(sim.id);
 sim=null;me=null;pg=null;
}
function startGPS(){
 if(!navigator.geolocation){gmsg='이 기기에서는 위치를 쓸 수 없어요.';renderG();return;}
 gmsg='위치를 확인하는 중이에요…';renderG();firstFix=true;
 watch=navigator.geolocation.watchPosition(pos=>{
  const la=pos.coords.latitude,lo=pos.coords.longitude,q=KM?proj(la,lo):llToXY(la,lo);
  if(!KM&&(q.x<-2||q.x>92||q.y<-2||q.y>44)){stopAll();gmsg='현재 위치가 이 예시 지도(제주) 밖이에요.';renderG();return;}
  me={x:q.x,y:q.y,src:'gps'};gmsg='';
  const old=pg?pg.passed:-1;pg=prog();renderG();if(pg&&pg.passed!==old)renderList();
  if(firstFix){firstFix=false;fitTo(dayPts(sd).concat([me]));}else drawMap();
 },()=>{stopAll();gmsg='위치를 가져오지 못했어요. 위치 권한을 확인해 주세요.';renderG();},{enableHighAccuracy:true,maximumAge:5000});
}
function startSim(){
 stopAll();const pts=dayPts(sd);
 if(pts.length<2){gmsg='방문지가 2곳 이상인 날에서 시뮬레이션할 수 있어요.';renderG();return;}
 gmsg='';sim={t:0,late:0,id:setInterval(simTick,150)};simTick();fitTo(pts);
}
/* 시뮬레이션: 실제로 이동하지 않고, 가상의 내 위치가 그날 경로(자동차는 도로, 도보는 직선)를 따라 움직이며
   진행률·경로 이탈·지연 표시를 미리 보여준다. 중간에 일부러 경로를 벗어나고 18분 늦는 상황을 넣었다 */
const simLine=()=>sched(sd).filter(r=>r.s).flatMap((r,i)=>i?r.s.path.slice(1):r.s.path);
function simTick(){
 const pts=simLine();
 if(!sim||pts.length<2){stopAll();renderG();renderList();drawMap();return;}
 sim.t=Math.min(1,sim.t+.004);sim.late=Math.round(18*Math.min(1,sim.t*2));
 const ls=[0];for(let i=1;i<pts.length;i++)ls.push(ls[i-1]+dist(pts[i-1],pts[i]));
 const tg=sim.t*ls[ls.length-1];let k=0;while(k<pts.length-2&&tg>ls[k+1])k++;
 const a=pts[k],b=pts[k+1],sl=ls[k+1]-ls[k]||1,f=Math.min(1,Math.max(0,(tg-ls[k])/sl)),dx=(b.x-a.x)/sl,dy=(b.y-a.y)/sl;
 const off=.05+(sim.t>.45&&sim.t<.6?2.6*Math.sin(Math.PI*(sim.t-.45)/.15):0);
 me={x:a.x+(b.x-a.x)*f-dy*off,y:a.y+(b.y-a.y)*f+dx*off,src:'sim'};
 const old=pg?pg.passed:-1;pg=prog();renderG();if(pg&&pg.passed!==old)renderList();drawMap();
 if(sim.t>=1){clearInterval(sim.id);sim.id=null;toast('마지막 방문지에 도착했어요');}
}
$('#gps').addEventListener('click',()=>{
 if(me||watch!=null||sim){stopAll();gmsg='';renderG();renderList();drawMap();}else startGPS();
});
$('#gstat').addEventListener('click',e=>{
 const b=e.target.closest('[data-g]');if(!b)return;
 if(b.dataset.g==='sim')startSim();else{stopAll();gmsg='';renderG();renderList();drawMap();}
});

