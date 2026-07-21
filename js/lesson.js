
let meta = null;
let pack = null;
let teacherMode = true;

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const arr = v => Array.isArray(v) ? v : [];
const valid = item => item && typeof item.file === 'string' && item.file.trim() !== '';

function fileUrl(folder, file){
  if(!file) return '';
  if(/^https?:\/\//i.test(file)) return file;
  if(file.startsWith('/')) return EMLS.url(file);
  return `${folder.replace(/\/$/,'')}/${file.replace(/^\//,'')}`;
}
function fileType(url=''){
  const clean = url.toLowerCase().split('?')[0];
  if(/\.(png|jpe?g|webp|gif|svg)$/.test(clean)) return 'image';
  if(/\.(mp4|webm|ogg)$/.test(clean)) return 'video';
  if(/\.(mp3|wav|m4a|aac|oga)$/.test(clean)) return 'audio';
  if(/\.pdf$/.test(clean)) return 'pdf';
  return 'file';
}
function visible(items){ return arr(items).filter(valid); }
function teacherTotal(){
  return visible(pack.methodology).length + visible(pack.teacherNotes).length + visible(pack.assessment).length;
}
function labelFor(item, fallback){ return item.title || fallback; }

function openPreview(url, type, title){
  const viewer = $('#previewViewer');
  if(!viewer) return;
  let html = '';
  if(type === 'pdf') html = `<iframe src="${url}" title="${title}"></iframe>`;
  else if(type === 'video') html = `<video controls autoplay src="${url}"></video>`;
  else if(type === 'audio') html = `<audio controls autoplay src="${url}"></audio>`;
  else if(type === 'image') html = `<img src="${url}" alt="${title}">`;
  else html = `<div class="empty-state"><a class="primary-btn" href="${url}" target="_blank">Отвори файла</a></div>`;
  $('#previewTitle').textContent = title;
  viewer.innerHTML = html;
  activate('preview');
}

function resourceCard(item, folder, icon, kind){
  const url = fileUrl(folder, item.file);
  const type = fileType(url);
  return `
    <article class="material-card material-${kind}">
      <span class="material-icon">${item.icon || icon}</span>
      <div class="material-copy">
        <strong>${labelFor(item,'Ресурс')}</strong>
        <small>${item.description || 'Отвори и използвай материала'}</small>
      </div>
      <div class="material-actions">
        ${type === 'file'
          ? `<a class="mini-btn" href="${url}" target="_blank">Отвори</a>`
          : `<button class="mini-btn preview-btn" data-url="${url}" data-type="${type}" data-title="${labelFor(item,'Ресурс')}">Преглед</button>`}
        <a class="icon-btn" href="${url}" download title="Изтегли">↓</a>
      </div>
    </article>`;
}
function materialGrid(items, folder, icon, kind, empty){
  const list = visible(items);
  if(!list.length) return `<div class="empty-state">${empty}</div>`;
  return `<div class="materials-grid">${list.map(x => resourceCard(x,folder,icon,kind)).join('')}</div>`;
}
function gallery(folder){
  const list = visible(pack.images);
  if(!list.length) return `<div class="empty-state">Няма добавени изображения.</div>`;
  return `<div class="gallery-grid">${list.map(item=>{
    const url=fileUrl(folder,item.file);
    return `<button class="gallery-tile" data-lightbox="${url}" data-caption="${labelFor(item,'Изображение')}">
      <img src="${url}" alt="${labelFor(item,'Изображение')}">
      <span>${labelFor(item,'Изображение')}</span>
    </button>`;
  }).join('')}</div>`;
}
function teacherMaterials(folder){
  const groups = [
    ['📘 План на урока', pack.methodology, '📘', 'methodology'],
    ['📄 Бележки на учителя', pack.teacherNotes, '📄', 'notes'],
    ['✅ Оценяване', pack.assessment, '✅', 'assessment']
  ];
  const html = groups.map(([title,items,icon,kind])=>{
    const list=visible(items);
    if(!list.length) return '';
    return `<section class="teacher-group"><h3>${title}</h3>${materialGrid(list,folder,icon,kind,'')}</section>`;
  }).join('');
  return html || `<div class="empty-state">Все още няма добавени методически материали.</div>`;
}
function tab(id, label, count=0, teacher=false){
  return `<button class="lesson-tab ${teacher?'teacher-only':''}" data-tab="${id}">
    ${label}${count ? `<span>${count}</span>`:''}
  </button>`;
}
function panel(id, title, body, teacher=false){
  return `<section class="lesson-panel ${teacher?'teacher-only':''}" id="panel-${id}">
    <div class="panel-heading"><h2>${title}</h2></div>${body}
  </section>`;
}
function activate(id){
  $$('.lesson-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
  $$('.lesson-panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${id}`));
  const target=$('.lesson-tabs-wrap');
  if(target) window.scrollTo({top:target.offsetTop-96,behavior:'smooth'});
}
function setMode(mode){
  teacherMode = mode === 'teacher';
  $$('.mode-toggle button').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
  $$('.teacher-only').forEach(x=>x.classList.toggle('mode-hidden',!teacherMode));
  if(!teacherMode && $('.lesson-tab.active')?.classList.contains('teacher-only')) activate('overview');
}
function bind(){
  $$('.lesson-tab').forEach(x=>x.addEventListener('click',()=>activate(x.dataset.tab)));
  $$('.mode-toggle button').forEach(x=>x.addEventListener('click',()=>setMode(x.dataset.mode)));
  $('#conductButton')?.addEventListener('click',()=>activate('conduct'));
  $$('.preview-btn').forEach(btn=>btn.addEventListener('click',()=>openPreview(btn.dataset.url,btn.dataset.type,btn.dataset.title)));
  $$('.gallery-tile').forEach(btn=>btn.addEventListener('click',()=>{
    $('#lightboxImage').src=btn.dataset.lightbox;
    $('#lightboxCaption').textContent=btn.dataset.caption;
    $('#lightbox').classList.add('open');
    $('#lightbox').setAttribute('aria-hidden','false');
  }));
  $('#lightboxClose')?.addEventListener('click',closeLightbox);
  $('#lightbox')?.addEventListener('click',e=>{if(e.target.id==='lightbox') closeLightbox();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeLightbox();});
}
function closeLightbox(){
  $('#lightbox')?.classList.remove('open');
  $('#lightbox')?.setAttribute('aria-hidden','true');
}
function conduct(folder){
  const steps=arr(pack.conductLesson);
  if(!steps.length) return `<div class="empty-state">Последователността предстои да бъде добавена.</div>`;
  return `<div class="conduct-flow">${steps.map((step,i)=>{
    let action='';
    if(step.game && meta.game) action=`<a class="mini-btn" href="${EMLS.url(meta.game)}">Стартирай</a>`;
    else if(step.file){
      const url=fileUrl(folder,step.file), type=fileType(url);
      action= type==='file'
        ? `<a class="mini-btn" href="${url}" target="_blank">Отвори</a>`
        : `<button class="mini-btn preview-btn" data-url="${url}" data-type="${type}" data-title="${step.title}">Отвори</button>`;
    }
    return `<article class="conduct-step"><span>${i+1}</span><div><strong>${step.title}</strong><small>${step.description||''}</small></div>${action}</article>`;
  }).join('')}</div>`;
}
function render(){
  const app=$('#lessonApp');
  const folder=EMLS.url(meta.resourceFolder || '');
  const cover=pack.cover ? fileUrl(folder,pack.cover) : '';
  const presentations=visible(pack.presentations);
  const worksheets=visible(pack.worksheets);
  const images=visible(pack.images);
  const videos=visible(pack.videos);
  const audio=visible(pack.audio);
  const teacher=teacherTotal();
  const objectives=arr(pack.objectives?.length?pack.objectives:meta.objectives);
  const competencies=arr(pack.competencies);
  const materials=arr(pack.materials);
  const tags=arr(pack.tags?.length?pack.tags:meta.tags);

  const tabs = [
    tab('overview','🏠 Преглед'),
    tab('conduct','🎓 Проведи урок'),
    presentations.length ? tab('presentations','📊 Презентации',presentations.length) : '',
    worksheets.length ? tab('worksheets','📝 Работни листове',worksheets.length) : '',
    images.length ? tab('gallery','🖼️ Галерия',images.length) : '',
    videos.length ? tab('video','🎥 Видео',videos.length) : '',
    audio.length ? tab('audio','🎵 Аудио',audio.length) : '',
    teacher ? tab('teacher','👩‍🏫 Методически материали',teacher,true) : '',
    valid(pack.download) ? tab('download','📦 Изтегляне') : '',
    tab('preview','🔎 Преглед')
  ].filter(Boolean).join('');

  const summary = [
    ['🎮',meta.game?1:0,'игра'],
    ['📊',presentations.length,'презентации'],
    ['📝',worksheets.length,'работни листове'],
    ['🎥',videos.length,'видео'],
    ['🎵',audio.length,'аудио'],
    ['🖼️',images.length,'изображения'],
    ['👩‍🏫',teacher,'материали за учителя']
  ].filter(x=>x[1]>0);

  app.innerHTML=`
  <section class="lesson-page">
    <div class="container">
      <div class="lesson-breadcrumbs"><a href="${EMLS.url('index.html')}">Начало</a> › <a href="${EMLS.url('pages/library.html')}">Библиотека</a> › ${meta.title}</div>

      <section class="lesson-hero">
        <div class="lesson-cover">
          ${cover?`<img src="${cover}" alt="Корица: ${meta.title}">`:`<div class="lesson-cover-fallback">${pack.icon||meta.icon||'📚'}</div>`}
          <span class="lesson-code">${meta.id}</span>
        </div>
        <div class="lesson-intro">
          <div class="lesson-kicker">
            <span>${meta.subject}</span><span>${meta.grade}. клас</span>
            <span>${pack.duration||meta.duration||'40 минути'}</span>
            <span>${pack.lessonType||meta.type||'Учебен комплект'}</span>
          </div>
          <h1>${meta.title}</h1>
          <p class="lead">${pack.description||meta.description||''}</p>
          <div class="lesson-actions">
            ${meta.game?`<a class="primary-btn" href="${EMLS.url(meta.game)}">▶ Стартирай играта</a>`:''}
            <button class="secondary-btn" id="conductButton">🎓 Проведи урок</button>
            <a class="secondary-btn" href="${EMLS.url('pages/library.html')}">← Библиотека</a>
          </div>
          <div class="mode-switch"><span>Режим:</span><div class="mode-toggle">
            <button class="active" data-mode="teacher">👩‍🏫 Учител</button>
            <button data-mode="student">👨‍🎓 Ученик</button>
          </div></div>
        </div>
      </section>

      <div class="lesson-summary">${summary.map(x=>`<div class="summary-card"><span>${x[0]}</span><div><strong>${x[1]}</strong><small>${x[2]}</small></div></div>`).join('')}</div>

      <div class="lesson-tabs-wrap"><div class="lesson-tabs">${tabs}</div></div>

      ${panel('overview','📖 За урока',`
        <div class="overview-grid">
          <div class="overview-main"><p class="overview-text">${pack.description||meta.description||''}</p>
            <div class="soft-card"><h3>🎯 Учебни цели</h3>${objectives.length?`<ul>${objectives.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>Предстои да бъдат добавени.</p>'}</div>
          </div>
          <aside class="overview-side">
            <div class="soft-card"><h3>🧠 Компетентности</h3>${competencies.length?`<ul>${competencies.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>Предстои да бъдат добавени.</p>'}</div>
            <div class="soft-card"><h3>🛠️ Необходими материали</h3>${materials.length?`<ul>${materials.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>Компютър и интерактивен дисплей.</p>'}</div>
            <div class="resource-badges">${tags.map(x=>`<span>${x}</span>`).join('')}</div>
          </aside>
        </div>`)}

      ${panel('conduct','🎓 Проведи урок',conduct(folder))}
      ${presentations.length?panel('presentations','📊 Презентации',materialGrid(presentations,folder,'📊','presentation','')):''}
      ${worksheets.length?panel('worksheets','📝 Работни листове',materialGrid(worksheets,folder,'📝','worksheet','')):''}
      ${images.length?panel('gallery','🖼️ Галерия',gallery(folder)):''}
      ${videos.length?panel('video','🎥 Видео',materialGrid(videos,folder,'🎥','video','')):''}
      ${audio.length?panel('audio','🎵 Аудио',materialGrid(audio,folder,'🎵','audio','')):''}
      ${teacher?panel('teacher','👩‍🏫 Методически материали',teacherMaterials(folder),true):''}
      ${valid(pack.download)?panel('download','📦 Изтегляне',materialGrid([pack.download],folder,'⬇️','download','')):''}
      ${panel('preview','🔎 Преглед на ресурс','<h3 id="previewTitle">Избери материал</h3><div class="media-viewer" id="previewViewer"><div class="empty-state">Избери бутон „Преглед“.</div></div>')}
    </div>
  </section>`;
  activate('overview');
  bind();
}
async function init(){
  const id=new URLSearchParams(location.search).get('id');
  const app=$('#lessonApp');
  try{
    if(!id) throw new Error('missing id');
    const all=await (await fetch(EMLS.url('data/resources.json'),{cache:'no-store'})).json();
    meta=all.find(x=>x.id===id);
    if(!meta) throw new Error('not found');
    pack=meta.packManifest ? await (await fetch(EMLS.url(meta.packManifest),{cache:'no-store'})).json() : {};
    render();
  }catch(err){
    console.error(err);
    app.innerHTML=`<section class="lesson-page"><div class="container"><div class="error-card"><h1>Комплектът не може да бъде зареден</h1><p>Провери pack.json и пътищата към файловете.</p><a class="primary-btn" href="${EMLS.url('pages/library.html')}">Към библиотеката</a></div></div></section>`;
  }
}
init();
