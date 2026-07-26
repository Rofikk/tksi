(function(){
  'use strict';
  const SESSION_KEY='kawan-bus-internal-session-v1';
  const ACCESS_PAGE='access.html';
  const MAX_AGE=8*60*60*1000;
  const ROLE_LABELS={
    pramusapa_organik:'Pramusapa Organik',
    pramusapa_vendor:'Pramusapa Vendor',
    buffer:'Pramusapa Pengganti (Buffer)',
    admin_vendor:'Admin Vendor',
    danru:'Danru',
    korlap:'Korlap',
    korwil:'Korwil Non-BRT'
  };
  const page=location.pathname.split('/').pop()||'index.html';
  if(page===ACCESS_PAGE)return;
  document.documentElement.style.visibility='hidden';
  function loadSession(){
    try{
      const session=JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if(!session||!ROLE_LABELS[session.role]||Date.now()>session.expiresAt)return null;
      return session;
    }catch{return null}
  }
  function allowed(role,target){
    if(target==='admin.html')return ['admin_vendor','danru','korlap','korwil'].includes(role);
    if(target==='reliever.html')return ['buffer','pramusapa_vendor','admin_vendor','danru','korlap','korwil'].includes(role);
    return Object.prototype.hasOwnProperty.call(ROLE_LABELS,role);
  }
  const session=loadSession();
  if(!session||!allowed(session.role,page)){
    sessionStorage.removeItem(SESSION_KEY);
    const next=encodeURIComponent(page+location.search+location.hash);
    location.replace(`${ACCESS_PAGE}?next=${next}${session?'&denied=1':''}`);
    return;
  }
  addEventListener('DOMContentLoaded',()=>{
    document.documentElement.style.visibility='';
    const badge=document.createElement('div');
    badge.className='internal-access-badge';
    badge.innerHTML=`<span>${ROLE_LABELS[session.role]}</span><button type="button">Keluar</button>`;
    badge.querySelector('button').addEventListener('click',()=>{
      sessionStorage.removeItem(SESSION_KEY);
      location.replace(ACCESS_PAGE);
    });
    document.body.appendChild(badge);
  });
})();
