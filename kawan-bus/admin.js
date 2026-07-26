const ASSIGNMENT_KEY='kawan-bus-vendor-assignments-v1';
const RELIEVER_KEY='kawan-bus-relievers-v1';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const load=(key)=>{try{return JSON.parse(localStorage.getItem(key))||[]}catch{return[]}};
const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const esc=value=>{const d=document.createElement('div');d.textContent=String(value??'');return d.innerHTML};
const uid=prefix=>crypto.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const statusName={assigned:'Menunggu konfirmasi',offered:'Ditawarkan',confirmed:'Dikonfirmasi',declined:'Ditolak',expired:'Kedaluwarsa',cancelled:'Dibatalkan'};

$$('[data-admin-tab]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-admin-tab]').forEach(item=>item.classList.toggle('active',item===button));
  $$('[data-admin-panel]').forEach(panel=>panel.hidden=panel.dataset.adminPanel!==button.dataset.adminTab);
  renderAll();
}));
$('#pkwt-date').value=$('#replacement-date').value=today();

function assignmentCard(item){
  return `<article class="admin-assignment"><div class="admin-assignment-top"><h3>${esc(item.officer||'Belum ditetapkan')} · ${esc(item.route)}</h3><span class="admin-status ${item.status==='confirmed'?'confirmed':''}">${esc(statusName[item.status]||item.status)}</span></div><p><span class="${['BUFFER','RELIEVER'].includes(item.employmentType)?'badge-reliever':'badge-pkwt'}">${esc(item.employmentType==='RELIEVER'?'BUFFER':item.employmentType||'PKWT')}</span> ${esc(item.vendor||'')} · ${esc(item.date)} · ${esc(item.shift)} · Unit ${esc(item.unit)}</p><p>${esc(item.direction)}${item.area?` · Plotting ${esc(item.area)}`:''}${['BUFFER','RELIEVER'].includes(item.employmentType)?' · Maks. 1 ritase':''}${item.replacementFor?` · Menggantikan ${esc(item.replacementFor)}`:''}</p>${item.status!=='cancelled'?`<button type="button" data-cancel="${item.id}">Batalkan penugasan</button>`:''}</article>`;
}

function renderAssignments(){
  const items=load(ASSIGNMENT_KEY).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  $('#admin-assignment-list').innerHTML=items.length?items.map(assignmentCard).join(''):'<div class="blank-list">Belum ada penugasan.</div>';
  const pkwt=items.filter(item=>item.assignmentSource!=='replacement');
  $('#pkwt-list').innerHTML=pkwt.length?pkwt.slice(0,8).map(assignmentCard).join(''):'<div class="blank-list">Belum ada jadwal PKWT.</div>';
  $$('[data-cancel]').forEach(button=>button.addEventListener('click',()=>{
    const list=load(ASSIGNMENT_KEY);const target=list.find(item=>item.id===button.dataset.cancel);
    if(target){target.status='cancelled';target.cancelledAt=new Date().toISOString();save(ASSIGNMENT_KEY,list);renderAll()}
  }));
}

function getStats(relieverId){
  const assignments=load(ASSIGNMENT_KEY).filter(item=>item.relieverId===relieverId);
  const completed=assignments.filter(item=>item.status==='confirmed').length;
  const declined=assignments.filter(item=>item.status==='declined').length;
  const last=assignments.filter(item=>item.status==='confirmed').sort((a,b)=>new Date(b.confirmedAt||b.createdAt)-new Date(a.confirmedAt||a.createdAt))[0];
  return {completed,declined,last:last?.confirmedAt||last?.createdAt||null};
}

function renderRelievers(){
  const people=load(RELIEVER_KEY);
  $('#reliever-list').innerHTML=people.length?people.map(person=>{
    const stats=getStats(person.id);const availability=(person.availability||[]).filter(item=>item.date>=today());
    return `<article class="admin-assignment"><div class="admin-assignment-top"><h3>${esc(person.name)} · ${esc(person.nik)}</h3><span class="badge-reliever">BUFFER</span></div><p>${esc(person.vendor)} · Area: ${esc(person.areas||'Semua')}</p><p>${availability.length} kesiapan mendatang · ${stats.completed} penugasan dikonfirmasi · ${stats.declined} penawaran ditolak</p></article>`;
  }).join(''):'<div class="blank-list">Belum ada Buffer terdaftar pada perangkat ini.</div>';
}

let currentNeed=null;
function rankCandidates(need){
  return load(RELIEVER_KEY).map(person=>{
    const availability=(person.availability||[]).find(item=>item.date===need.date&&(item.shift===need.shift||item.shift==='Semua'));
    if(!availability)return null;
    const areas=(person.areas||'').toLowerCase();
    const areaMatch=!areas||areas.includes('semua')||areas.split(',').some(area=>need.area.toLowerCase().includes(area.trim()));
    if(!areaMatch)return null;
    return {...person,stats:getStats(person.id),availability};
  }).filter(Boolean).sort((a,b)=>a.stats.completed-b.stats.completed||new Date(a.stats.last||0)-new Date(b.stats.last||0)||a.name.localeCompare(b.name));
}

function renderCandidates(){
  if(!currentNeed)return;
  const candidates=rankCandidates(currentNeed);
  $('#candidate-list').innerHTML=candidates.length?candidates.map((person,index)=>`<article class="candidate-card"><div class="candidate-rank"><span>${index+1}</span><div><h3>${esc(person.name)} · ${esc(person.nik)}</h3><p>${esc(person.vendor)} · tersedia ${esc(person.availability.shift)} · area ${esc(person.areas||'Semua')}</p></div></div><div class="mini-stats"><div><small>Tugas dikonfirmasi</small><strong>${person.stats.completed}</strong></div><div><small>Terakhir bertugas</small><strong>${person.stats.last?new Date(person.stats.last).toLocaleDateString('id-ID'):'Belum pernah'}</strong></div><div><small>Dasar urutan</small><strong>${index===0?'Prioritas pertama':'Antrean '+(index+1)}</strong></div></div><button class="primary-button" type="button" data-offer="${person.id}">Tawarkan penugasan</button></article>`).join(''):'<div class="blank-list">Tidak ada Buffer yang siap dan sesuai area/shift. Admin dapat menghubungi kandidat melalui prosedur resmi tanpa mengubah urutan pemerataan.</div>';
  $$('[data-offer]').forEach(button=>button.addEventListener('click',()=>offerAssignment(button.dataset.offer)));
}

function offerAssignment(relieverId){
  const person=load(RELIEVER_KEY).find(item=>item.id===relieverId);if(!person||!currentNeed)return;
  const assignments=load(ASSIGNMENT_KEY);
  assignments.push({id:uid('assignment'),employmentType:'BUFFER',assignmentSource:'replacement',relieverId:person.id,maxRitase:1,officer:person.name,nik:person.nik,vendor:person.vendor,date:currentNeed.date,route:currentNeed.route,unit:currentNeed.unit,shift:currentNeed.shift,direction:currentNeed.direction,area:currentNeed.area,replacementFor:currentNeed.replacementFor,replacementReason:currentNeed.reason,status:'offered',createdAt:new Date().toISOString(),offerExpiresAt:new Date(Date.now()+10*60*1000).toISOString()});
  save(ASSIGNMENT_KEY,assignments);alert(`Penawaran diberikan kepada ${person.name} selama 10 menit.`);currentNeed=null;$('#replacement-form').reset();$('#replacement-date').value=today();$('#candidate-list').innerHTML='<div class="blank-list">Penawaran telah dibuat. Pantau status pada menu Semua Penugasan.</div>';renderAssignments();
}

$('#pkwt-form').addEventListener('submit',event=>{
  event.preventDefault();if(!event.currentTarget.reportValidity())return;
  const items=load(ASSIGNMENT_KEY);
  items.push({id:uid('assignment'),employmentType:$('#direct-type').value,assignmentSource:'schedule',area:$('#pkwt-plotting').value.trim(),maxRitase:$('#direct-type').value==='BUFFER'?1:null,officer:$('#pkwt-officer').value.trim(),nik:$('#pkwt-nik').value.trim(),vendor:$('#pkwt-vendor').value,date:$('#pkwt-date').value,route:$('#pkwt-route').value.trim().toUpperCase(),unit:$('#pkwt-unit').value.trim().toUpperCase(),shift:$('#pkwt-shift').value,direction:$('#pkwt-direction').value.trim(),status:'assigned',createdAt:new Date().toISOString()});
  save(ASSIGNMENT_KEY,items);event.currentTarget.reset();$('#pkwt-date').value=today();renderAll();
});

$('#replacement-form').addEventListener('submit',event=>{
  event.preventDefault();if(!event.currentTarget.reportValidity())return;
  currentNeed={replacementFor:$('#replacement-for').value.trim(),reason:$('#replacement-reason').value,date:$('#replacement-date').value,shift:$('#replacement-shift').value,route:$('#replacement-route').value.trim().toUpperCase(),unit:$('#replacement-unit').value.trim().toUpperCase(),area:$('#replacement-area').value.trim(),direction:$('#replacement-direction').value.trim()};
  renderCandidates();
});

function renderAll(){renderAssignments();renderRelievers();if(currentNeed)renderCandidates()}
addEventListener('storage',event=>{if([ASSIGNMENT_KEY,RELIEVER_KEY].includes(event.key))renderAll()});
renderAll();
