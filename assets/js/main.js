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
const navigation=[
  ['index.html','Beranda'],
  ['panduan.html','Panduan'],
  ['knowledge/transportasi.html','KO-001'],
  ['jutpi.html','JUTPI'],
  ['glosarium.html','Glosarium'],
  ['referensi.html','Referensi']
];
const links=document.querySelector('#nav-links');
if(links){
  links.innerHTML=navigation.map(([path,label])=>{
    const target=base+path;
    const active=(current==='transportasi.html'&&path.includes('transportasi'))||current===path;
    return `<a${active?' class="active"':''} href="${target}">${label}</a>`;
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
if(search){const items=[...document.querySelectorAll('#glossary article')];const empty=document.querySelector('#empty');search.addEventListener('input',()=>{const q=search.value.toLocaleLowerCase('id').trim();let shown=0;items.forEach(item=>{const match=!q||item.dataset.term.includes(q)||item.textContent.toLocaleLowerCase('id').includes(q);item.hidden=!match;if(match)shown++});empty.hidden=shown!==0})}
const toc=document.querySelector('.toc');
if(toc){
  const tocToggle=document.createElement('button');
  tocToggle.className='toc-toggle';
  tocToggle.type='button';
  tocToggle.setAttribute('aria-expanded','false');
  tocToggle.textContent='Daftar isi artikel';
  toc.prepend(tocToggle);
  tocToggle.addEventListener('click',()=>{const open=!toc.classList.contains('open');toc.classList.toggle('open',open);tocToggle.setAttribute('aria-expanded',String(open))});
  toc.addEventListener('click',event=>{if(event.target.closest('a')&&innerWidth<=850){toc.classList.remove('open');tocToggle.setAttribute('aria-expanded','false')}});
  const anchors=[...toc.querySelectorAll('a[href^="#"]')];
  const sections=anchors.map(anchor=>document.querySelector(anchor.getAttribute('href'))).filter(Boolean);
  if(sections.length&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){anchors.forEach(a=>a.classList.toggle('current',a.getAttribute('href')===`#${entry.target.id}`))}})},{rootMargin:'-25% 0px -65% 0px'});
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
