const ASSIGNMENT_KEY='kawan-bus-vendor-assignments-v1';
const RELIEVER_KEY='kawan-bus-relievers-v1';
const PROFILE_KEY='kawan-bus-active-reliever-v1';
const $=selector=>document.querySelector(selector);
const load=key=>{try{return JSON.parse(localStorage.getItem(key))||[]}catch{return[]}};
const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const esc=value=>{const d=document.createElement('div');d.textContent=String(value??'');return d.innerHTML};
const uid=()=>crypto.randomUUID?.()||`reliever-${Date.now()}`;
const today=()=>new Date().toISOString().slice(0,10);
let activeId=localStorage.getItem(PROFILE_KEY)||'';

function activeProfile(){return load(RELIEVER_KEY).find(item=>item.id===activeId)}
function renderProfile(){
  const profile=activeProfile();if(!profile)return;
  $('#reliever-name').value=profile.name;$('#reliever-nik').value=profile.nik;$('#reliever-vendor').value=profile.vendor;$('#reliever-areas').value=profile.areas;
}
function renderAvailability(){
  const profile=activeProfile();
  $('#availability-list').innerHTML=profile?.availability?.length?profile.availability.sort((a,b)=>a.date.localeCompare(b.date)).map(item=>`<div class="availability-item"><span>${esc(item.date)} · ${esc(item.shift)}</span><button type="button" data-remove="${item.id}" aria-label="Hapus ketersediaan">Hapus</button></div>`).join(''):'<div class="blank-list">Simpan profil, lalu tambahkan waktu tersedia.</div>';
  document.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>{const people=load(RELIEVER_KEY);const person=people.find(item=>item.id===activeId);if(person){person.availability=(person.availability||[]).filter(item=>item.id!==button.dataset.remove);save(RELIEVER_KEY,people);renderAvailability()}}));
}
function renderOffers(){
  const offers=load(ASSIGNMENT_KEY).filter(item=>item.relieverId===activeId&&['offered','confirmed','declined'].includes(item.status)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  $('#offer-list').innerHTML=activeId?(offers.length?offers.map(item=>`<article class="offer-card"><div class="admin-assignment-top"><h2>${esc(item.route)} · ${esc(item.shift)}</h2><span class="admin-status ${item.status==='confirmed'?'confirmed':''}">${item.status==='offered'?'Menunggu jawaban':item.status==='confirmed'?'Diterima':'Ditolak'}</span></div><p>${esc(item.date)} · Unit ${esc(item.unit)} · ${esc(item.direction)}</p><p>Menggantikan ${esc(item.replacementFor)} · ${esc(item.replacementReason)}</p>${item.status==='offered'?`<p>Konfirmasi penawaran dalam 10 menit setelah diterima dari Admin Vendor.</p><div class="offer-actions"><button class="primary-button" type="button" data-accept="${item.id}">Terima tugas</button><button class="decline-button" type="button" data-decline="${item.id}">Tidak tersedia</button></div>`:''}</article>`).join(''):'<div class="blank-list">Belum ada penawaran. Ketersediaan Anda tetap tercatat dalam antrean.</div>'):'<div class="blank-list">Simpan profil terlebih dahulu untuk melihat penawaran.</div>';
  document.querySelectorAll('[data-accept]').forEach(button=>button.addEventListener('click',()=>setOffer(button.dataset.accept,'confirmed')));
  document.querySelectorAll('[data-decline]').forEach(button=>button.addEventListener('click',()=>setOffer(button.dataset.decline,'declined')));
}
function setOffer(id,status){
  const items=load(ASSIGNMENT_KEY);const target=items.find(item=>item.id===id&&item.relieverId===activeId);if(!target)return;
  target.status=status;target[status==='confirmed'?'confirmedAt':'declinedAt']=new Date().toISOString();save(ASSIGNMENT_KEY,items);renderOffers();
}
$('#profile-form').addEventListener('submit',event=>{
  event.preventDefault();if(!event.currentTarget.reportValidity())return;
  const people=load(RELIEVER_KEY);let person=people.find(item=>item.id===activeId);
  if(!person){person={id:uid(),availability:[],createdAt:new Date().toISOString()};people.push(person);activeId=person.id;localStorage.setItem(PROFILE_KEY,activeId)}
  Object.assign(person,{name:$('#reliever-name').value.trim(),nik:$('#reliever-nik').value.trim(),vendor:$('#reliever-vendor').value,areas:$('#reliever-areas').value.trim(),updatedAt:new Date().toISOString()});
  save(RELIEVER_KEY,people);renderAvailability();renderOffers();alert('Profil reliever tersimpan.');
});
$('#new-profile').addEventListener('click',()=>{
  activeId='';localStorage.removeItem(PROFILE_KEY);$('#profile-form').reset();renderAvailability();renderOffers();$('#reliever-name').focus();
});
$('#availability-form').addEventListener('submit',event=>{
  event.preventDefault();const people=load(RELIEVER_KEY);const person=people.find(item=>item.id===activeId);
  if(!person){alert('Simpan profil reliever terlebih dahulu.');return}
  const date=$('#available-date').value,shift=$('#available-shift').value;
  if(!date)return;if((person.availability||[]).some(item=>item.date===date&&item.shift===shift)){alert('Ketersediaan tersebut sudah tercatat.');return}
  person.availability=person.availability||[];person.availability.push({id:`available-${Date.now()}`,date,shift});save(RELIEVER_KEY,people);renderAvailability();
});
$('#available-date').min=today();$('#available-date').value=today();
addEventListener('storage',event=>{if([ASSIGNMENT_KEY,RELIEVER_KEY].includes(event.key)){renderAvailability();renderOffers()}});
renderProfile();renderAvailability();renderOffers();
