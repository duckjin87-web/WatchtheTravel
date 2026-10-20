
const toMin=s=>{const a=s.split(':');return +a[0]*60+ +a[1];};
const hm=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const dur=m=>{const h=Math.floor(m/60),mm=m%60;return h&&mm?h+'시간 '+mm+'분':h?h+'시간':mm+'분';};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fmtD=d=>d<1?(Math.round(d*100)*10)+'m':d.toFixed(1)+'km';
const dlabel=i=>{const d=new Date(trip.start+'T00:00:00');d.setDate(d.getDate()+i);return (d.getMonth()+1)+'/'+d.getDate()+'('+'일월화수목금토'[d.getDay()]+')';};

function sched(di){
 const d=trip.days[di];let t=toMin(d.start);const rows=[];
 d.items.forEach((it,i)=>{
  const p=P[it.id],arr=t,dep=arr+it.stay,nx=d.items[i+1];let dm=0,km=0;
  if(nx){const dd=dist(p,P[nx.id]);dm=Math.max(3,Math.round(dd*1.35*1.2));km=Math.max(1,Math.round(dd*1.35));}
  rows.push({it,p,arr,dep,dm,km});t=dep+dm;
 });
 return rows;
}
const dayPts=di=>trip.days[di].items.map(it=>P[it.id]);
const curP=()=>P[trip.days[sd].items[sel].id];
function nearby(){
 if(sel==null||!trip.days[sd].items[sel])return[];
 const a=curP();
 return DB.filter(p=>p.c!=='명소'&&dist(a,p)<=nb.r&&(nb.t==='전체'||p.c===nb.t)&&(nb.s==='전체'||p.src.indexOf(nb.s)>-1)&&(p.r==null?nb.min===0:p.r>=nb.min))
  .map(p=>({p,d:dist(a,p)})).sort((x,y)=>x.d-y.d);
}

