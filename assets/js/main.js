const inKnowledge=location.pathname.includes('/knowledge/');
const base=inKnowledge?'../':'';
const current=location.pathname.split('/').pop()||'index.html';
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
if(toggle&&links){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));links.classList.toggle('open')})}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const search=document.querySelector('#term-search');
if(search){const items=[...document.querySelectorAll('#glossary article')];const empty=document.querySelector('#empty');search.addEventListener('input',()=>{const q=search.value.toLocaleLowerCase('id').trim();let shown=0;items.forEach(item=>{const match=!q||item.dataset.term.includes(q)||item.textContent.toLocaleLowerCase('id').includes(q);item.hidden=!match;if(match)shown++});empty.hidden=shown!==0})}
