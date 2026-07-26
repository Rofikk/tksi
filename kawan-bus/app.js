const STORAGE_KEY='kawan-bus-pilot-v1';
const state=loadState();
let pendingPlan=null;
let installPrompt=null;

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const pad=value=>String(value).padStart(2,'0');
const toMinutes=value=>{const [hour,minute]=value.split(':').map(Number);return hour*60+minute};
const toClock=value=>`${pad((value+1440)%1440/60|0)}.${pad((value+1440)%60)}`;
const dateLabel=value=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`));

function loadState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{trips:[],active:null}}
  catch{return{trips:[],active:null}}
}
function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}
function showView(name){
  $$('[data-view]').forEach(button=>{
    const active=button.dataset.view===name;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  $$('[data-panel]').forEach(panel=>{
    const active=panel.dataset.panel===name;
    panel.hidden=!active;
    panel.classList.toggle('active',active);
  });
  if(name==='trip')renderActiveTrip();
  if(name==='learn')renderLearning();
  scrollTo({top:document.querySelector('.section-nav').offsetTop-72,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}

$$('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.go)));

const today=new Date();
$('#travel-date').value=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

function historyFor(origin,destination){
  return state.trips.filter(trip=>trip.origin.toLowerCase()===origin.toLowerCase()&&trip.destination.toLowerCase()===destination.toLowerCase());
}

$('#planner-form').addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const origin=data.get('origin').trim();
  const destination=data.get('destination').trim();
  const arrival=data.get('arrival');
  const duration=Number(data.get('duration'));
  const reliability=data.get('reliability');
  const history=historyFor(origin,destination);
  const historicDuration=history.length?Math.round(history.reduce((sum,trip)=>sum+trip.actualDuration,0)/history.length):null;
  const serviceBuffer={stable:10,unknown:20,variable:30,disrupted:45}[reliability];
  const historyError=history.length?Math.max(5,Math.round(history.reduce((sum,trip)=>sum+Math.max(0,trip.actualDuration-trip.plannedDuration),0)/history.length)):0;
  const buffer=Math.max(serviceBuffer,historyError);
  const expected=historicDuration||duration;
  const depart=toMinutes(arrival)-expected-buffer;
  const earlyArrival=toMinutes(arrival)-Math.max(5,Math.round(buffer*.45));
  const confidence=history.length>=5?'sedang':history.length>=2?'rendah–sedang':'rendah';
  const reasons=[
    `Waktu normal ${duration} menit berasal dari input Anda.`,
    `${reliability==='stable'?'Kondisi dinilai stabil':reliability==='variable'?'Kondisi dinilai sering berubah':reliability==='disrupted'?'Gangguan telah ditandai':'Kondisi layanan belum diketahui'}, sehingga disiapkan cadangan ${buffer} menit.`,
    history.length?`${history.length} perjalanan serupa di perangkat ikut digunakan sebagai pembanding.`:'Belum ada histori perjalanan serupa; hasil ini masih menjadi baseline awal.'
  ];
  pendingPlan={
    id:crypto.randomUUID?.()||`plan-${Date.now()}`,
    origin,destination,date:data.get('date'),arrival,duration,expected,buffer,
    suggestedDeparture:toClock(depart).replace('.',':'),
    preference:data.get('preference'),reliability,confidence,createdAt:new Date().toISOString()
  };
  $('#recommendation-title').textContent=reliability==='disrupted'?'Perjalanan perlu cadangan lebih besar':'Perjalanan dapat dipertimbangkan';
  $('#confidence-badge').textContent=`Keyakinan ${confidence}`;
  $('#depart-time').textContent=toClock(depart);
  $('#buffer-time').textContent=`${buffer} menit`;
  $('#arrival-range').textContent=`${toClock(earlyArrival)}–${toClock(toMinutes(arrival)+Math.round(buffer*.35))}`;
  $('#recommendation-reasons').innerHTML=reasons.map(reason=>`<li>${escapeHtml(reason)}</li>`).join('');
  $('#recommendation').hidden=false;
  $('#recommendation').scrollIntoView({behavior:'smooth',block:'nearest'});
});

$('#accept-plan').addEventListener('click',()=>{
  if(!pendingPlan)return;
  state.active=pendingPlan;
  saveState();
  showView('trip');
});
$('#dismiss-plan').addEventListener('click',()=>{
  pendingPlan=null;
  $('#recommendation').hidden=true;
});

function renderActiveTrip(){
  const active=state.active;
  $('#no-active-trip').hidden=Boolean(active);
  $('#trip-form').hidden=!active;
  if(!active)return;
  $('#active-trip-route').textContent=`${active.origin} → ${active.destination}`;
  $('#active-trip-schedule').textContent=`${dateLabel(active.date)} · tiba ${active.arrival.replace(':','.')}`;
  $('#actual-departure').value=active.suggestedDeparture;
}

$$('input[name="outcome"]').forEach(input=>input.addEventListener('change',()=>{
  $('#issue-field').hidden=input.value!=='problem'||!input.checked;
}));

$('#trip-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!state.active)return;
  const actualDeparture=$('#actual-departure').value;
  const arriveStop=$('#arrive-stop').value;
  const busArrival=$('#bus-arrival').value;
  const actualArrival=$('#actual-arrival').value;
  const outcome=$('input[name="outcome"]:checked').value;
  if(outcome==='problem'&&!$('#issue').value){
    $('#issue').focus();
    return;
  }
  const duration=Math.max(0,toMinutes(actualArrival)-toMinutes(actualDeparture));
  const wait=Math.max(0,toMinutes(busArrival)-toMinutes(arriveStop));
  state.trips.unshift({
    ...state.active,
    actualDeparture,arriveStop,busArrival,actualArrival,
    actualDuration:duration,
    plannedDuration:state.active.expected+state.active.buffer,
    wait,outcome,issue:outcome==='problem'?$('#issue').value:'',
    note:$('#trip-note').value.trim(),
    onTime:toMinutes(actualArrival)<=toMinutes(state.active.arrival),
    completedAt:new Date().toISOString()
  });
  state.active=null;
  saveState();
  event.currentTarget.reset();
  $('#issue-field').hidden=true;
  showView('learn');
});

const issueNames={
  'long-wait':'Menunggu terlalu lama','full-bus':'Bus penuh',information:'Informasi tidak sesuai',
  transfer:'Transit menyulitkan',access:'Akses halte/bus stop',service:'Pelayanan',other:'Kendala lainnya'
};

function renderLearning(){
  const trips=state.trips;
  const issues=trips.filter(trip=>trip.outcome==='problem');
  const avgWait=trips.length?Math.round(trips.reduce((sum,trip)=>sum+trip.wait,0)/trips.length):null;
  const ontime=trips.length?Math.round(trips.filter(trip=>trip.onTime).length/trips.length*100):null;
  $('#metric-trips').textContent=trips.length;
  $('#metric-wait').textContent=avgWait??'—';
  $('#metric-ontime').textContent=ontime===null?'—':`${ontime}%`;
  $('#metric-issues').textContent=issues.length;

  const findings=[];
  if(trips.length){
    findings.push({
      level:'Observasi',
      title:`Waktu tunggu rata-rata ${avgWait} menit`,
      copy:`Dihitung dari ${trips.length} perjalanan yang tersimpan di perangkat ini.`
    });
  }
  const issueCounts=issues.reduce((counts,trip)=>(counts[trip.issue]=(counts[trip.issue]||0)+1,counts),{});
  Object.entries(issueCounts).sort((a,b)=>b[1]-a[1]).forEach(([issue,count])=>{
    findings.push({
      level:count>=3?'Pola terdeteksi':'Observasi',
      title:`${issueNames[issue]||'Kendala'} tercatat ${count} kali`,
      copy:count>=3?'Kejadian mulai berulang. Lokasi, waktu, dan kondisi operasional perlu dibandingkan sebelum menyimpulkan penyebab.':'Belum cukup data untuk menyatakan masalah berulang.'
    });
  });
  if(trips.length>=3&&ontime<70){
    findings.push({
      level:'Dugaan awal',
      title:'Cadangan waktu mungkin belum memadai',
      copy:'Tingkat ketepatan tiba masih di bawah 70%. Periksa sumber keterlambatan sebelum mengubah rekomendasi.'
    });
  }
  $('#finding-count').textContent=`${findings.length} temuan`;
  $('#findings-list').innerHTML=findings.length?findings.map(finding=>`
    <article class="finding">
      <div class="finding-top"><h4>${escapeHtml(finding.title)}</h4><span class="finding-level">${escapeHtml(finding.level)}</span></div>
      <p>${escapeHtml(finding.copy)}</p>
    </article>`).join(''):'<div class="blank-list">Belum ada temuan. Selesaikan perjalanan pertama untuk membuat baseline.</div>';

  $('#history-list').innerHTML=trips.length?trips.map(trip=>`
    <article class="history-item">
      <div class="history-top"><strong>${escapeHtml(trip.origin)} → ${escapeHtml(trip.destination)}</strong><span class="${trip.onTime?'':'late'}">${trip.onTime?'Tepat waktu':'Terlambat'}</span></div>
      <p>${dateLabel(trip.date)} · ${trip.actualDeparture.replace(':','.')}–${trip.actualArrival.replace(':','.')}</p>
      <div class="history-meta"><span>Menunggu ${trip.wait} menit</span><span>Durasi ${trip.actualDuration} menit</span>${trip.issue?`<span>${escapeHtml(issueNames[trip.issue]||trip.issue)}</span>`:''}</div>
    </article>`).join(''):'<div class="blank-list">Riwayat perjalanan akan muncul di sini.</div>';
}

$('#clear-data').addEventListener('click',()=>{
  if(!state.trips.length&&!state.active)return;
  if(!confirm('Hapus seluruh catatan perjalanan Kawan Bus pada perangkat ini?'))return;
  state.trips=[];
  state.active=null;
  saveState();
  renderLearning();
});

function escapeHtml(value){
  const div=document.createElement('div');
  div.textContent=String(value);
  return div.innerHTML;
}

addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  $('#install-app').hidden=false;
});
$('#install-app').addEventListener('click',async()=>{
  if(!installPrompt)return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt=null;
  $('#install-app').hidden=true;
});

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
renderActiveTrip();
renderLearning();
