
let catalog=[],active='all';
const grid=document.getElementById('grid');
const search=document.getElementById('search');
const buttons=[...document.querySelectorAll('.filter')];

function render(){
 const term=search.value.trim().toLowerCase();
 const items=catalog.filter(x=>{
   const okSubject=active==='all'||x.subject===active;
   const hay=[x.title,x.subjectLabel,x.grade,x.description,...x.tags].join(' ').toLowerCase();
   return okSubject&&hay.includes(term);
 });
 grid.innerHTML='';
 items.forEach(x=>{
   const card=document.createElement('article');
   card.className='card';
   card.innerHTML=`<div class="banner ${x.theme==='default'?'':x.theme}"><div class="icon">${x.icon}</div></div>
   <div class="body"><h3>${x.title}</h3><p>${x.description}</p>
   <div class="tags"><span class="tag">${x.subjectLabel}</span><span class="tag">${x.grade}</span>${x.tags.slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
   <a class="cta play" href="${x.url}">▶ Играй</a></div>`;
   grid.appendChild(card);
 });
 document.getElementById('empty').classList.toggle('hidden',items.length>0);
}
fetch('data/catalog.json').then(r=>r.json()).then(data=>{catalog=data;render()});
buttons.forEach(b=>b.addEventListener('click',()=>{
 buttons.forEach(x=>x.classList.remove('active'));b.classList.add('active');active=b.dataset.filter;render();
}));
search.addEventListener('input',render);
document.querySelectorAll('[data-subject]').forEach(x=>x.addEventListener('click',()=>{
 const b=buttons.find(y=>y.dataset.filter===x.dataset.subject);if(b)b.click();
 document.getElementById('library').scrollIntoView({behavior:'smooth'});
}));
