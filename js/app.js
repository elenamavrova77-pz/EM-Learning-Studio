
let catalog=[],active='all';
const grid=document.getElementById('grid');
const search=document.getElementById('search');
const buttons=[...document.querySelectorAll('.filter')];

function themeClass(theme){return theme==='teal'?'teal':theme==='purple'?'purple':theme==='orange'?'orange':''}
function render(){
  if(!grid) return;
  const term=(search?.value||'').trim().toLowerCase();
  const items=catalog.filter(x=>{
    const okSubject=active==='all'||x.subject===active;
    const hay=[x.title,x.subjectLabel,x.grade,x.description,...(x.tags||[])].join(' ').toLowerCase();
    return okSubject&&hay.includes(term);
  });
  grid.innerHTML='';
  items.forEach(x=>{
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML=`<div class="banner ${themeClass(x.theme)}"><div class="icon">${x.icon}</div></div>
      <div class="body"><h3>${x.title}</h3><p>${x.description}</p>
      <div class="tags"><span class="tag">${x.subjectLabel}</span><span class="tag">${x.grade}</span>
      ${(x.tags||[]).slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <a class="cta play" href="${x.url}">▶ Играй</a></div>`;
    grid.appendChild(card);
  });
  const empty=document.getElementById('empty');
  if(empty) empty.classList.toggle('hidden',items.length>0);
}
fetch('../data/catalog.json').catch(()=>fetch('data/catalog.json')).then(r=>r.json()).then(data=>{catalog=data;render()});
buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('active'));b.classList.add('active');active=b.dataset.filter;render()}));
if(search) search.addEventListener('input',render);
