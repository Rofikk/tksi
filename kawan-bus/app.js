const STORAGE_KEY='kawan-bus-pramusapa-v3';
const ASSIGNMENT_KEY='kawan-bus-vendor-assignments-v1';
const state=loadState();
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const conditionOptions={
  safety:['Pelanggan sakit atau jatuh','Risiko keselamatan di dalam bus','Gangguan keamanan atau konflik','Kejadian penting lainnya'],
  comfort:['AC atau suhu kabin','Kebersihan kabin','Kursi atau fasilitas rusak','Kepadatan mengganggu kenyamanan','Kondisi lainnya'],
  information:['Informasi rute tidak tersedia','Informasi berbeda dengan kondisi aktual','Pelanggan membutuhkan informasi lanjutan','Kondisi lainnya'],
  service:['Pelanggan prioritas membutuhkan bantuan','Barang tertinggal atau ditemukan','Keluhan pelayanan','Kebutuhan lainnya']
};
const categoryNames={safety:'Keselamatan & keamanan',comfort:'Kenyamanan',information:'Informasi',service:'Pelayanan'};

function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{reports:[],confirmedAssignmentId:null}}catch{return{reports:[],confirmedAssignmentId:null}}}
function loadAssignments(){try{return JSON.parse(localStorage.getItem(ASSIGNMENT_KEY))||[]}catch{return[]}}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch{return false}}
function saveAssignments(items){try{localStorage.setItem(ASSIGNMENT_KEY,JSON.stringify(items));return true}catch{return false}}
function getAssignment(){return loadAssignments().filter(item=>['assigned','confirmed'].includes(item.status)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]||null}
function escapeHtml(value){const element=document.createElement('div');element.textContent=String(value);return element.innerHTML}
function formatDate(value=new Date()){return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(value)}
function formatTime(value){return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace('.',':')}

function showView(name){
  $$('[data-panel]').forEach(panel=>{const active=panel.dataset.panel===name;panel.hidden=!active;panel.classList.toggle('active',active)});
  $$('[data-view]').forEach(button=>{const active=button.dataset.view===name;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  if(name==='history')renderHistory();
  if(name==='report')renderReportContext();
  scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.go)));

function renderDuty(){
  const duty=getAssignment();
  const confirmed=Boolean(duty&&state.confirmedAssignmentId===duty.id);
  $('#duty-card').hidden=!duty;
  if(!duty){
    $('#greeting-title').textContent='Menunggu penugasan Admin Vendor.';
    $('#greeting-copy').textContent='Pramusapa tidak perlu mengatur tugas. Periksa kembali setelah Admin Vendor membuat penugasan.';
    return;
  }
  $('#greeting-title').textContent=confirmed?`Selamat bertugas, ${duty.officer.split(' ')[0]}.`:'Periksa penugasan Anda.';
  $('#greeting-copy').textContent=confirmed?'Gunakan Kawan Bus hanya ketika kondisi memungkinkan dan pelanggan tetap terpantau.':'Pastikan rute, unit, shift, dan arah sudah sesuai sebelum mengonfirmasi.';
  $('#assignment-status').textContent=confirmed?'Dikonfirmasi':'Menunggu konfirmasi';
  $('#duty-date').textContent=formatDate(new Date(duty.date+'T12:00:00'));
  $('#duty-route').textContent=`Rute ${duty.route} · ${duty.direction}`;
  $('#duty-officer').textContent=duty.officer;
  $('#duty-vendor').textContent=duty.vendor;
  $('#duty-unit').textContent=duty.unit;
  $('#duty-shift').textContent=`${duty.shift} · ${duty.direction}`;
}
function openAssignment(){
  const duty=getAssignment();
  $('#assignment-empty').hidden=Boolean(duty);
  $('#assignment-detail').hidden=!duty;
  $('#confirm-assignment').hidden=!duty||state.confirmedAssignmentId===duty.id;
  if(duty){
    $('#assignment-officer').textContent=duty.officer+(duty.nik?` · ${duty.nik}`:'');
    $('#assignment-vendor').textContent=duty.vendor;
    $('#assignment-route').textContent=`${duty.route} · ${duty.direction}`;
    $('#assignment-unit').textContent=duty.unit;
    $('#assignment-shift').textContent=duty.shift;
    $('#assignment-date').textContent=formatDate(new Date(duty.date+'T12:00:00'));
  }
  $('#assignment-dialog').showModal();
}
$('#view-assignment').addEventListener('click',openAssignment);
$('#close-assignment').addEventListener('click',()=>$('#assignment-dialog').close());
$('#confirm-assignment').addEventListener('click',()=>{
  const duty=getAssignment();
  if(!duty)return;
  state.confirmedAssignmentId=duty.id;
  const assignments=loadAssignments();
  const target=assignments.find(item=>item.id===duty.id);
  if(target){target.status='confirmed';target.confirmedAt=new Date().toISOString();saveAssignments(assignments)}
  saveState();
  $('#assignment-dialog').close();
  renderDuty();
});

const answerCards=$$('#answer-grid article');
function filterAnswers(){
  const query=$('#service-search').value.toLocaleLowerCase('id').trim();
  const topic=$('.topic-chips button.active')?.dataset.topic||'all';
  let visible=0;
  answerCards.forEach(card=>{const matchesTopic=topic==='all'||card.dataset.topic===topic;const matchesQuery=!query||`${card.dataset.search} ${card.textContent}`.toLocaleLowerCase('id').includes(query);card.hidden=!(matchesTopic&&matchesQuery);if(!card.hidden)visible++});
  $('#answer-empty').hidden=visible!==0;
}
$('#service-search').addEventListener('input',filterAnswers);
$$('.topic-chips button').forEach(button=>button.addEventListener('click',()=>{$$('.topic-chips button').forEach(item=>item.classList.toggle('active',item===button));filterAnswers()}));

$$('input[name="category"]').forEach(input=>input.addEventListener('change',()=>{const select=$('#condition');select.disabled=false;select.innerHTML='<option value="">Pilih kondisi</option>'+conditionOptions[input.value].map(value=>`<option>${escapeHtml(value)}</option>`).join('')}));
$('#report-note').addEventListener('input',event=>$('#note-count').textContent=event.target.value.length);
function renderReportContext(){const duty=getAssignment();const confirmed=duty&&state.confirmedAssignmentId===duty.id;$('#report-context').textContent=confirmed?`${formatDate(new Date(duty.date+'T12:00:00'))} · Rute ${duty.route} · ${duty.direction} · Unit ${duty.unit} · ${duty.vendor}`:'Penugasan belum dikonfirmasi. Konfirmasikan penugasan Admin Vendor agar konteks laporan terisi otomatis.'}
$('#report-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!event.currentTarget.reportValidity())return;
  const duty=getAssignment();
  if(!duty||state.confirmedAssignmentId!==duty.id){alert('Konfirmasikan penugasan dari Admin Vendor sebelum menyimpan laporan.');openAssignment();return}
  const category=$('input[name="category"]:checked').value;
  const report={id:crypto.randomUUID?.()||`report-${Date.now()}`,createdAt:new Date().toISOString(),category,condition:$('#condition').value,urgency:$('input[name="urgency"]:checked').value,note:$('#report-note').value.trim(),duty:{...duty},status:'local'};
  state.reports.unshift(report);
  if(!saveState()){alert('Laporan belum dapat disimpan pada perangkat ini. Gunakan prosedur pelaporan resmi.');return}
  event.currentTarget.reset();$('#condition').disabled=true;$('#condition').innerHTML='<option value="">Pilih jenis kondisi terlebih dahulu</option>';$('#note-count').textContent='0';event.currentTarget.hidden=true;$('#report-success').hidden=false;
});
$$('[data-go="report"]').forEach(button=>button.addEventListener('click',()=>{$('#report-form').hidden=false;$('#report-success').hidden=true}));

function renderHistory(){
  const reports=state.reports;
  $('#report-count').textContent=reports.length;$('#urgent-count').textContent=reports.filter(report=>report.urgency==='soon').length;
  $('#history-list').innerHTML=reports.length?reports.map(report=>`<article class="history-item"><div class="history-item-top"><h2>${escapeHtml(report.condition)}</h2><span class="${report.urgency==='soon'?'soon':''}">${report.urgency==='soon'?'Perlu segera diperiksa':'Tindak lanjut'}</span></div><p>${escapeHtml(categoryNames[report.category])} · ${formatDate(new Date(report.createdAt))} ${formatTime(report.createdAt)}</p><p>Rute ${escapeHtml(report.duty.route)} · Unit ${escapeHtml(report.duty.unit)} · Tersimpan lokal, belum terkirim.</p>${report.note?`<p>Catatan: ${escapeHtml(report.note)}</p>`:''}</article>`).join(''):'<div class="blank-list">Belum ada laporan. Kondisi normal tidak perlu dilaporkan.</div>';
}
$('#clear-reports').addEventListener('click',()=>{if(!state.reports.length)return;if(!confirm('Hapus seluruh riwayat laporan lokal pada perangkat ini?'))return;state.reports=[];saveState();renderHistory()});
$('#emergency-guide').addEventListener('click',()=>$('#emergency-dialog').showModal());
$('#close-emergency').addEventListener('click',()=>$('#emergency-dialog').close());
addEventListener('storage',event=>{if(event.key===ASSIGNMENT_KEY){renderDuty();renderReportContext()}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
renderDuty();renderReportContext();renderHistory();
const requestedView=new URLSearchParams(location.search).get('view');
if(['duty','assist','report','history'].includes(requestedView))showView(requestedView);