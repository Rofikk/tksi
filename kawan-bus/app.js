const STORAGE_KEY='kawan-bus-pramusapa-v2';
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

function loadState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{duty:null,reports:[]}}
  catch{return{duty:null,reports:[]}}
}
function saveState(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}
  catch{return false}
}
function escapeHtml(value){
  const element=document.createElement('div');
  element.textContent=String(value);
  return element.innerHTML;
}
function formatDate(value=new Date()){
  return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(value);
}
function formatTime(value){
  return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace('.',':');
}
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
  const duty=state.duty;
  $('#duty-card').hidden=!duty;
  $('#edit-duty').textContent=duty?'Ubah penugasan':'Atur penugasan';
  if(!duty)return;
  $('#greeting-title').textContent=`Selamat bertugas, ${duty.officer.split(' ')[0]}.`;
  $('#greeting-copy').textContent='Gunakan Kawan Bus hanya ketika kondisi memungkinkan dan pelanggan tetap terpantau.';
  $('#duty-date').textContent=formatDate();
  $('#duty-route').textContent=`Rute ${duty.route} · ${duty.direction}`;
  $('#duty-officer').textContent=duty.officer;
  $('#duty-vendor').textContent=duty.vendor;
  $('#duty-unit').textContent=duty.unit;
  $('#duty-shift').textContent=`${duty.shift} · ${duty.direction}`;
}
function openDuty(){
  const duty=state.duty;
  if(duty){
    $('#officer-name').value=duty.officer;
    $('#vendor').value=duty.vendor;
    $('#route').value=duty.route;
    $('#unit').value=duty.unit;
    $('#shift').value=duty.shift;
    $('#direction').value=duty.direction;
  }
  $('#duty-dialog').showModal();
}
$('#edit-duty').addEventListener('click',openDuty);
$('#duty-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!event.currentTarget.reportValidity())return;
  state.duty={
    officer:$('#officer-name').value.trim(),
    vendor:$('#vendor').value,
    route:$('#route').value.trim().toUpperCase(),
    unit:$('#unit').value.trim().toUpperCase(),
    shift:$('#shift').value,
    direction:$('#direction').value.trim(),
    startedAt:new Date().toISOString()
  };
  saveState();
  $('#duty-dialog').close();
  renderDuty();
});

const answerCards=$$('#answer-grid article');
function filterAnswers(){
  const query=$('#service-search').value.toLocaleLowerCase('id').trim();
  const topic=$('.topic-chips button.active')?.dataset.topic||'all';
  let visible=0;
  answerCards.forEach(card=>{
    const matchesTopic=topic==='all'||card.dataset.topic===topic;
    const matchesQuery=!query||`${card.dataset.search} ${card.textContent}`.toLocaleLowerCase('id').includes(query);
    card.hidden=!(matchesTopic&&matchesQuery);
    if(!card.hidden)visible++;
  });
  $('#answer-empty').hidden=visible!==0;
}
$('#service-search').addEventListener('input',filterAnswers);
$$('.topic-chips button').forEach(button=>button.addEventListener('click',()=>{
  $$('.topic-chips button').forEach(item=>item.classList.toggle('active',item===button));
  filterAnswers();
}));

$$('input[name="category"]').forEach(input=>input.addEventListener('change',()=>{
  const select=$('#condition');
  select.disabled=false;
  select.innerHTML='<option value="">Pilih kondisi</option>'+conditionOptions[input.value].map(value=>`<option>${escapeHtml(value)}</option>`).join('');
}));
$('#report-note').addEventListener('input',event=>$('#note-count').textContent=event.target.value.length);
function renderReportContext(){
  const duty=state.duty;
  $('#report-context').textContent=duty?`${formatDate()} · Rute ${duty.route} · ${duty.direction} · Unit ${duty.unit} · ${duty.vendor}`:'Penugasan belum diatur. Laporan tetap dapat disimpan, tetapi konteks rute dan unit akan kosong.';
}
$('#report-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!event.currentTarget.reportValidity())return;
  const category=$('input[name="category"]:checked').value;
  const report={
    id:crypto.randomUUID?.()||`report-${Date.now()}`,
    createdAt:new Date().toISOString(),
    category,
    condition:$('#condition').value,
    urgency:$('input[name="urgency"]:checked').value,
    note:$('#report-note').value.trim(),
    duty:state.duty?{...state.duty}:null,
    status:'local'
  };
  state.reports.unshift(report);
  const saved=saveState();
  if(!saved){
    alert('Laporan belum dapat disimpan pada perangkat ini. Gunakan prosedur pelaporan resmi.');
    return;
  }
  event.currentTarget.reset();
  $('#condition').disabled=true;
  $('#condition').innerHTML='<option value="">Pilih jenis kondisi terlebih dahulu</option>';
  $('#note-count').textContent='0';
  event.currentTarget.hidden=true;
  $('#report-success').hidden=false;
});
$$('[data-go="report"]').forEach(button=>button.addEventListener('click',()=>{
  $('#report-form').hidden=false;
  $('#report-success').hidden=true;
}));

function renderHistory(){
  const reports=state.reports;
  $('#report-count').textContent=reports.length;
  $('#urgent-count').textContent=reports.filter(report=>report.urgency==='soon').length;
  $('#history-list').innerHTML=reports.length?reports.map(report=>`
    <article class="history-item">
      <div class="history-item-top"><h2>${escapeHtml(report.condition)}</h2><span class="${report.urgency==='soon'?'soon':''}">${report.urgency==='soon'?'Perlu segera diperiksa':'Tindak lanjut'}</span></div>
      <p>${escapeHtml(categoryNames[report.category])} · ${formatDate(new Date(report.createdAt))} ${formatTime(report.createdAt)}</p>
      <p>${report.duty?`Rute ${escapeHtml(report.duty.route)} · Unit ${escapeHtml(report.duty.unit)} · `:''}Tersimpan lokal, belum terkirim.</p>
      ${report.note?`<p>Catatan: ${escapeHtml(report.note)}</p>`:''}
    </article>`).join(''):'<div class="blank-list">Belum ada laporan. Kondisi normal tidak perlu dilaporkan.</div>';
}
$('#clear-reports').addEventListener('click',()=>{
  if(!state.reports.length)return;
  if(!confirm('Hapus seluruh riwayat laporan lokal pada perangkat ini?'))return;
  state.reports=[];
  saveState();
  renderHistory();
});

$('#emergency-guide').addEventListener('click',()=>$('#emergency-dialog').showModal());
$('#close-emergency').addEventListener('click',()=>$('#emergency-dialog').close());
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
renderDuty();
renderReportContext();
renderHistory();
