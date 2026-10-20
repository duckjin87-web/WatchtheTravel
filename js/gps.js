/* ---------- 내 위치 ---------- */
let sim=null,watch=null,firstFix=true;
const llToXY=(la,lo)=>({x:4+(lo-126.15)/.8*82,y:3.5+(33.57-la)/.37*34});
function prog(){
 if(!me)return null;const pts=dayPts(sd);if(!pts.length)return null;
 let nr=0,nd=1e9;pts.forEach((p,k)=>{const d=dist(me,p);if(d<nd){nd=d;nr=k;}});
 if(pts.length===1)return{i:0,t:0,d:nd,px:pts[0].x,py:pts[0].y,near:0,nd:nd,passed:nd<.4?1:0};
 let best=null;
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((me.x-a.x)*dx+(me.y-a.y)*dy)/l2)),px=a.x+dx*t,py=a.y+dy*t,d=Math.hypot(me.x-px,me.y-py);
  if(!best||d<best.d)best={i:i,t:t,d:d,px:px,py:py};
 }
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
 if(!me){el.innerHTML='<span>'+gmsg+'</span><button class="chip" data-g="sim">시뮬레이션으로 보기</button>';return;}
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
  const q=llToXY(pos.coords.latitude,pos.coords.longitude);
  if(q.x<-2||q.x>92||q.y<-2||q.y>44){stopAll();gmsg='현재 위치가 이 예시 지도(제주) 밖이에요.';renderG();return;}
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
function simTick(){
 const pts=dayPts(sd);
 if(!sim||pts.length<2){stopAll();renderG();renderList();drawMap();return;}
 sim.t=Math.min(1,sim.t+.004);sim.late=Math.round(18*Math.min(1,sim.t*2));
 const ls=[0];for(let i=1;i<pts.length;i++)ls.push(ls[i-1]+dist(pts[i-1],pts[i]));
 const tg=sim.t*ls[ls.length-1];let k=0;while(k<pts.length-2&&tg>ls[k+1])k++;
 const a=pts[k],b=pts[k+1],sl=ls[k+1]-ls[k]||1,f=Math.min(1,Math.max(0,(tg-ls[k])/sl)),dx=(b.x-a.x)/sl,dy=(b.y-a.y)/sl;
 const off=.2+(sim.t>.45&&sim.t<.6?2.6*Math.sin(Math.PI*(sim.t-.45)/.15):0);
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

