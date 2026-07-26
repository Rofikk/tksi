const inKnowledge=location.pathname.includes('/knowledge/');
const base=inKnowledge?'../':'';
const current=location.pathname.split('/').pop()||'index.html';
const main=document.querySelector('main');
if(main&&!main.id)main.id='main';
if(main&&!document.querySelector('.skip-link')){
  const skip=document.createElement('a');skip.className='skip-link';skip.href='#'+main.id;skip.textContent='Lewati ke konten';document.body.prepend(skip);
}
const nav=document.querySelector('.site-header nav');
if(nav&&!nav.hasAttribute('aria-label'))nav.setAttribute('aria-label','Navigasi utama');
const definitions=document.querySelector('#definitions');
if(definitions&&!definitions.querySelector(':scope > .eyebrow'))definitions.insertAdjacentHTML('afterbegin','<p class="eyebrow">Bagian 2</p>');
const navigation=[
  ['index.html','Beranda'],
  ['panduan.html','Mulai Belajar'],
  ['domain.html','Pengetahuan'],
  ['kawan-bus/','Kawan Bus'],
  ['tentang.html','Tentang']
];
const links=document.querySelector('#nav-links');
if(links){
  links.innerHTML=navigation.map(([path,label])=>{
    const target=base+path;
    const knowledgePages=['transportasi.html','jutpi.html','glosarium.html','referensi.html','domain.html'];
    const active=(path==='domain.html'&&knowledgePages.includes(current))||current===path;
    return `<a${active?' class="active" aria-current="page"':''} href="${target}">${label}</a>`;
  }).join('');
}
const toggle=document.querySelector('.nav-toggle');
if(toggle&&links){
  toggle.innerHTML='<span class="menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span>';
  toggle.setAttribute('aria-label','Buka menu navigasi');
  const backdrop=document.createElement('div');
  backdrop.className='nav-backdrop';
  document.body.appendChild(backdrop);
  const setMenu=open=>{
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');
    links.classList.toggle('open',open);
    backdrop.classList.toggle('open',open);
    document.body.classList.toggle('nav-open',open);
  };
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
  backdrop.addEventListener('click',()=>setMenu(false));
  links.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});
  matchMedia('(min-width: 851px)').addEventListener('change',event=>{if(event.matches)setMenu(false)});
}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const search=document.querySelector('#term-search');
if(search){
  const glossary=document.querySelector('#glossary');
  const items=[...document.querySelectorAll('#glossary article')].sort((a,b)=>a.querySelector('h2').textContent.localeCompare(b.querySelector('h2').textContent,'id',{sensitivity:'base'}));
  const groups=new Map();
  items.forEach(item=>{
    const heading=item.querySelector('h2');
    const letter=heading.textContent.trim().charAt(0).toLocaleUpperCase('id');
    heading.outerHTML=`<h3>${heading.innerHTML}</h3>`;
    if(!groups.has(letter)){
      const section=document.createElement('section');section.className='glossary-group';section.id=`glossary-${letter}`;section.dataset.letter=letter;section.innerHTML=`<h2 class="glossary-group-title">${letter}</h2><div class="glossary-group-grid"></div>`;groups.set(letter,section);glossary.appendChild(section);
    }
    groups.get(letter).querySelector('.glossary-group-grid').appendChild(item);
  });
  const alphabet=document.createElement('nav');alphabet.className='alphabet-nav';alphabet.setAttribute('aria-label','Navigasi alfabet glosarium');
  alphabet.innerHTML='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter=>groups.has(letter)?`<a href="#glossary-${letter}" aria-label="Istilah huruf ${letter}">${letter}</a>`:`<span aria-hidden="true">${letter}</span>`).join('');
  const alphabetWrap=document.createElement('div');alphabetWrap.className='alphabet-nav-wrap';alphabetWrap.appendChild(alphabet);glossary.before(alphabetWrap);
  const empty=document.querySelector('#empty');
  search.setAttribute('aria-controls','glossary');
  search.addEventListener('input',()=>{const q=search.value.toLocaleLowerCase('id').trim();let shown=0;items.forEach(item=>{const match=!q||item.dataset.term.includes(q)||item.textContent.toLocaleLowerCase('id').includes(q);item.hidden=!match;if(match)shown++});groups.forEach(group=>group.hidden=![...group.querySelectorAll('article')].some(item=>!item.hidden));empty.hidden=shown!==0;empty.setAttribute('aria-live','polite')});
  if('IntersectionObserver' in window){
    const groupObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        let activeLink;
        alphabet.querySelectorAll('a').forEach(link=>{
          const active=link.getAttribute('href')===`#${entry.target.id}`;
          link.classList.toggle('current',active);
          if(active)activeLink=link;
        });
        if(activeLink&&innerWidth<=850){
          const left=activeLink.offsetLeft-(alphabet.clientWidth-activeLink.offsetWidth)/2;
          alphabet.scrollTo({left:Math.max(0,left),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
        }
      });
    },{rootMargin:'-25% 0px -65% 0px'});
    groups.forEach(group=>groupObserver.observe(group));
  }
}
const toc=document.querySelector('.toc');
if(toc){
  const tocHome=toc.parentNode;
  const tocNext=toc.nextSibling;
  const tocToggle=document.createElement('button');
  tocToggle.className='toc-toggle';
  tocToggle.type='button';
  tocToggle.setAttribute('aria-expanded','false');
  tocToggle.setAttribute('aria-controls','article-toc');
  tocToggle.innerHTML='<span>Daftar isi</span><small>Bagian artikel</small>';
  toc.id='article-toc';
  document.body.appendChild(tocToggle);
  const tocClose=document.createElement('button');tocClose.className='toc-close';tocClose.type='button';tocClose.setAttribute('aria-label','Tutup daftar isi');tocClose.textContent='×';toc.prepend(tocClose);
  const tocBackdrop=document.createElement('div');tocBackdrop.className='toc-backdrop';document.body.appendChild(tocBackdrop);
  const setToc=open=>{toc.classList.toggle('open',open);tocBackdrop.classList.toggle('open',open);tocToggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('toc-open',open);if(open)tocClose.focus()};
  tocToggle.addEventListener('click',()=>setToc(true));
  tocClose.addEventListener('click',()=>{setToc(false);tocToggle.focus()});
  tocBackdrop.addEventListener('click',()=>setToc(false));
  toc.addEventListener('click',event=>{if(event.target.closest('a')&&innerWidth<=850)setToc(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toc.classList.contains('open')){setToc(false);tocToggle.focus()}});
  const tocMedia=matchMedia('(max-width: 850px)');
  const placeToc=()=>{setToc(false);if(tocMedia.matches){if(toc.parentNode!==document.body)document.body.appendChild(toc)}else if(toc.parentNode!==tocHome){tocHome.insertBefore(toc,tocNext)}};
  tocMedia.addEventListener('change',placeToc);placeToc();
  const anchors=[...toc.querySelectorAll('a[href^="#"]')];
  const sections=anchors.map(anchor=>document.querySelector(anchor.getAttribute('href'))).filter(Boolean);
  if(sections.length&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){anchors.forEach(a=>{const active=a.getAttribute('href')===`#${entry.target.id}`;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});const label=anchors.find(a=>a.getAttribute('href')===`#${entry.target.id}`)?.textContent?.trim();if(label)tocToggle.querySelector('small').textContent=label}})},{rootMargin:'-25% 0px -65% 0px'});
    sections.forEach(section=>observer.observe(section));
  }
  const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.body.appendChild(progress);
  const updateProgress=()=>{const doc=document.documentElement;const max=doc.scrollHeight-innerHeight;progress.style.width=`${max?Math.min(100,scrollY/max*100):0}%`};
  addEventListener('scroll',updateProgress,{passive:true});updateProgress();
}
const topButton=document.createElement('button');
topButton.className='back-to-top';topButton.type='button';topButton.setAttribute('aria-label','Kembali ke atas');topButton.textContent='↑';document.body.appendChild(topButton);
addEventListener('scroll',()=>topButton.classList.toggle('visible',scrollY>650),{passive:true});
topButton.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
const jutpiCards=[...document.querySelectorAll('.jutpi-card[data-part]')];
if(jutpiCards.length){
  const storageKey='tksi-jutpi-progress-v1';
  const readProgress=()=>{try{return new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'))}catch{return new Set()}};
  let completed=readProgress();
  const label=document.querySelector('#jutpi-progress-label');
  const bar=document.querySelector('#jutpi-progress-bar');
  const track=document.querySelector('.progress-track');
  const render=()=>{
    jutpiCards.forEach(card=>{const done=completed.has(card.dataset.part);card.classList.toggle('completed',done);const state=card.querySelector('.read-state');if(state)state.textContent=done?'Sudah dibaca':'Belum dibaca'});
    const count=completed.size;
    if(label)label.textContent=`${count} dari ${jutpiCards.length} bagian dibaca`;
    if(bar)bar.style.width=`${count/jutpiCards.length*100}%`;
    if(track)track.setAttribute('aria-valuenow',String(count));
  };
  jutpiCards.forEach(card=>card.querySelector('.jutpi-card-link')?.addEventListener('click',()=>{completed.add(card.dataset.part);try{localStorage.setItem(storageKey,JSON.stringify([...completed]))}catch{}render()}));
  document.querySelector('#reset-jutpi-progress')?.addEventListener('click',()=>{completed.clear();try{localStorage.removeItem(storageKey)}catch{}render()});
  const stages=[...document.querySelectorAll('.learning-stage')];
  document.querySelectorAll('.jutpi-quick-nav a[href^="#jutpi-"]').forEach(link=>link.addEventListener('click',()=>{const target=document.querySelector(link.getAttribute('href'));const stage=target?.closest('.learning-stage');if(stage)stage.open=true}));
  const stageMedia=matchMedia('(max-width: 850px)');
  const setStageMode=()=>{if(stageMedia.matches)stages.forEach((stage,index)=>stage.open=index===0);else stages.forEach(stage=>stage.open=true)};
  stageMedia.addEventListener('change',setStageMode);setStageMode();render();
}
const preferenceBox=document.querySelector('.reader-personalizer');
if(preferenceBox){
  const key='tksi-reader-preference-v1';
  const audienceButtons=[...preferenceBox.querySelectorAll('[data-audience]')];
  const intentButtons=[...preferenceBox.querySelectorAll('[data-intent]')];
  const result=preferenceBox.querySelector('#personalizer-result');
  const resultTitle=preferenceBox.querySelector('#recommendation-title');
  const resultCopy=preferenceBox.querySelector('#recommendation-copy');
  const resultRole=preferenceBox.querySelector('#recommendation-role');
  const resultLink=preferenceBox.querySelector('#recommendation-link');
  let choice={audience:'',intent:''};
  const audienceNames={practitioner:'praktisi layanan transportasi',student:'mahasiswa atau pembelajar',public:'pelanggan atau anggota masyarakat',researcher:'peneliti atau penyusun laporan'};
  const audienceRoles={
    public:'Keterlibatan Anda: pahami hak dan kewajiban pelanggan, jaga keselamatan, gunakan fasilitas secara bertanggung jawab, dan sampaikan masukan berdasarkan fakta.',
    practitioner:'Keterlibatan Anda: hubungkan konsep dengan keputusan pelayanan, indikator kinerja, pengalaman pelanggan, dan perbaikan operasional.',
    student:'Keterlibatan Anda: bangun fondasi konsep, uji pemahaman, lalu gunakan pengetahuan untuk membaca persoalan transportasi secara kritis.',
    researcher:'Keterlibatan Anda: periksa definisi, data, asumsi, dan sumber agar analisis serta rekomendasi dapat ditelusuri.'
  };
  const recommendations={
    foundation:{title:'Bangun fondasi melalui KO-001',copy:'Mulai dari cerita sehari-hari, lalu pahami transportasi, mobilitas, aksesibilitas, dan sistem.',href:'knowledge/transportasi.html#opening'},
    operations:{title:'Hubungkan konsep dengan kondisi operasional',copy:'Mulai dari pelayanan dan kinerja, kemudian lanjutkan ke konteks Transjakarta dan kerangka perbaikan.',href:'knowledge/transportasi.html#service-performance'},
    jutpi:{title:'Ikuti jalur belajar JUTPI',copy:'Pelajari fondasi, sistem perjalanan, Jabodetabek, dan penerapannya melalui lima tahap terarah.',href:'jutpi.html'},
    term:{title:'Gunakan Glosarium TKSI',copy:'Cari istilah transportasi secara alfabetis tanpa harus membaca seluruh artikel terlebih dahulu.',href:'glosarium.html'},
    source:{title:'Telusuri Referensi dan sitasi',copy:'Periksa 26 sumber, format APA 7, serta dasar ilmiah yang digunakan dalam KO-001.',href:'referensi.html'}
  };
  const setPressed=(buttons,value,dataKey)=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[dataKey]===value)));
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(choice))}catch{}};
  const renderPreference=()=>{
    setPressed(audienceButtons,choice.audience,'audience');
    setPressed(intentButtons,choice.intent,'intent');
    const ready=choice.audience&&choice.intent;
    result.hidden=!ready;
    if(!ready)return;
    const recommendation={...recommendations[choice.intent]};
    if(choice.audience==='student'&&choice.intent==='foundation'){recommendation.copy='Mulai dari tujuan pembelajaran dan peta konsep, kemudian ikuti Bagian 1–19 secara berurutan.';recommendation.href='knowledge/transportasi.html#objectives'}
    if(choice.audience==='public'&&choice.intent==='foundation')recommendation.copy='Mulai dari cerita pembuka dan contoh kehidupan sehari-hari sebelum masuk ke istilah teknis.';
    if(choice.audience==='researcher'&&choice.intent==='foundation'){recommendation.copy='Mulai dari perbandingan definisi, definisi sintesis TKSI, dan sumber yang dapat ditelusuri.';recommendation.href='knowledge/transportasi.html#definitions'}
    if(choice.audience==='practitioner'&&choice.intent==='operations')recommendation.copy='Mulai dari indikator pelayanan dan kinerja, lalu hubungkan dengan Transjakarta, Non-BRT, dan PERMATA.';
    resultTitle.textContent=recommendation.title;
    resultCopy.textContent=`Sebagai ${audienceNames[choice.audience]}, ${recommendation.copy.charAt(0).toLocaleLowerCase('id')+recommendation.copy.slice(1)}`;
    resultRole.textContent=audienceRoles[choice.audience];
    resultLink.href=recommendation.href;
    save();
  };
  [...audienceButtons,...intentButtons].forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.audience)choice.audience=button.dataset.audience;
    if(button.dataset.intent)choice.intent=button.dataset.intent;
    renderPreference();
  }));
  preferenceBox.querySelector('#reset-preference')?.addEventListener('click',()=>{choice={audience:'',intent:''};try{localStorage.removeItem(key)}catch{}renderPreference();audienceButtons[0]?.focus()});
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.audience&&saved?.intent)choice=saved}catch{}
  renderPreference();
  const resume=preferenceBox.querySelector('#resume-reading');
  try{
    const last=JSON.parse(localStorage.getItem('tksi-last-reading-v1')||'null');
    if(last?.href&&last?.label&&resume){resume.href=last.href;resume.querySelector('#resume-reading-label').textContent=last.label;resume.hidden=false}
  }catch{}
}
const curiosityButton=document.querySelector('#random-curiosity');
if(curiosityButton){
  const questions=[...document.querySelectorAll('.curiosity-grid a')];
  curiosityButton.addEventListener('click',()=>{
    questions.forEach(question=>question.classList.remove('suggested'));
    const selected=questions[Math.floor(Math.random()*questions.length)];
    if(!selected)return;
    selected.classList.add('suggested');
    selected.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    selected.focus({preventScroll:true});
  });
}
const readingSections=[...document.querySelectorAll('article.prose section[id]')];
if(readingSections.length&&'IntersectionObserver' in window){
  const readingObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const heading=entry.target.querySelector('h2')?.textContent?.trim();
    if(!heading)return;
    try{localStorage.setItem('tksi-last-reading-v1',JSON.stringify({href:`knowledge/transportasi.html#${entry.target.id}`,label:heading}))}catch{}
  }),{rootMargin:'-30% 0px -60% 0px'});
  readingSections.forEach(section=>readingObserver.observe(section));
}
