const $=s=>document.querySelector(s);
const ic=(n,s=18)=>'<svg width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-'+n+'"/></svg>';
$('#open-s').innerHTML=ic('search')+' 장소 검색';
$('#refit').innerHTML=ic('target');
$('#gps').innerHTML=ic('nav');
$('#sclose').innerHTML=ic('x');
