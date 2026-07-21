let meta = null;
let pack = null;
let allResources = [];
let teacherMode = true;
let visitedTabs = new Set();

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const arr = v => Array.isArray(v) ? v : [];
const valid = item => item && typeof item.file === 'string' && item.file.trim() !== '';
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function fileUrl(folder, file){
  if(!file) return '';
  if(/^(https?:|data:|blob:)/i.test(file)) return file;

  const folderPath = String(folder || '').replace(/^\/+|\/+$/g, '');
  const filePath = String(file).replace(/^\/+/, '');
  const joinedPath = folderPath ? `${folderPath}/${filePath}` : filePath;

  return EMLS.url(joinedPath);
}
function fileType(url=''){
  const clean = url.toLowerCase().split('?')[0];
  if(/\.(png|jpe?g|webp|gif|svg)$/.test(clean)) return 'image';
  if(/\.(mp4|webm|ogg)$/.test(clean)) return 'video';
  if(/\.(mp3|wav|m4a|aac|oga)$/.test(clean)) return 'audio';
  if(/\.pdf$/.test(clean)) return 'pdf';
  return 'file';
}
function typeLabel(type){ return ({pdf:'PDF документ',video:'Видео',audio:'Аудио',image:'Изображение',file:'Файл'})[type] || 'Файл'; }
function visible(items){ return arr(items).filter(valid); }
function teacherTotal(){ return visible(pack.methodology).length + visible(pack.teacherNotes).length + visible(pack.assessment).length; }
function labelFor(item, fallback){ return item.title || fallback; }

function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('emls-theme', theme);
  const btn = $('#themeToggle');
  if(btn){ btn.textContent = theme === 'dark' ? '☀️' : '🌙'; btn.title = theme === 'dark' ? 'Светла тема' : 'Тъмна тема'; }
}
function setupTheme(){
  const saved = localStorage.getItem('emls-theme');
  const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || preferred);
  $('#themeToggle')?.addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
}
function favoriteKey(){ return `emls-favorite-${meta?.id || 'lesson'}`; }
function modeKey(){ return `emls-mode-${meta?.id || 'lesson'}`; }
function progressKey(){ return `emls-progress-${meta?.id || 'lesson'}`; }
function loadProgress(){
  try{ visitedTabs = new Set(JSON.parse(localStorage.getItem(progressKey()) || '[\"overview\"]')); }
  catch{ visitedTabs = new Set(['overview']); }
}
function saveProgress(){ localStorage.setItem(progressKey(), JSON.stringify([...visitedTabs])); }
function trackableTabs(){
  return $$('.lesson-tab').filter(tab => !tab.classList.contains('teacher-only') && tab.dataset.tab !== 'preview' && tab.dataset.tab !== 'related');
}
function updateProgress(){
  const tabs = trackableTabs();
  const done = tabs.filter(tab => visitedTabs.has(tab.dataset.tab)).length;
  const percent = tabs.length ? Math.round((done / tabs.length) * 100) : 0;
  const bar = $('#lessonProgressBar');
  const label = $('#lessonProgressLabel');
  if(bar) bar.style.width = `${percent}%`;
  if(label) label.textContent = `${percent}% завършено`;
  $$('.lesson-tab').forEach(tab => tab.classList.toggle('visited', visitedTabs.has(tab.dataset.tab)));
}
function resetProgress(){
  visitedTabs = new Set(['overview']);
  saveProgress();
  updateProgress();
  activate('overview');
}

function updateFavoriteButton(){
  const btn = $('#favoriteButton');
  if(!btn) return;
  const active = localStorage.getItem(favoriteKey()) === '1';
  btn.classList.toggle('active', active);
  btn.innerHTML = active ? '★ В любими' : '☆ Добави в любими';
  btn.setAttribute('aria-pressed', String(active));
}
function toggleFavorite(){
  const active = localStorage.getItem(favoriteKey()) === '1';
  localStorage.setItem(favoriteKey(), active ? '0' : '1');
  updateFavoriteButton();
  setMode(localStorage.getItem(modeKey()) || 'teacher');
  updateProgress();
}
function openPreview(url, type, title){
  const viewer = $('#previewViewer');
  if(!viewer) return;
  let html = '';
  if(type === 'pdf') html = `<iframe src="${esc(url)}" title="${esc(title)}"></iframe>`;
  else if(type === 'video') html = `<video controls autoplay src="${esc(url)}"></video>`;
  else if(type === 'audio') html = `<audio controls autoplay src="${esc(url)}"></audio>`;
  else if(type === 'image') html = `<img src="${esc(url)}" alt="${esc(title)}">`;
  else html = `<div class="empty-state"><a class="primary-btn" href="${esc(url)}" target="_blank" rel="noopener">Отвори файла</a></div>`;
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
        <span class="file-pill">${typeLabel(type)}</span>
        <strong>${esc(labelFor(item,'Ресурс'))}</strong>
        <small>${esc(item.description || 'Отвори и използвай материала')}</small>
      </div>
      <div class="material-actions">
        ${type === 'file'
          ? `<a class="mini-btn" href="${esc(url)}" target="_blank" rel="noopener">Отвори</a>`
          : `<button class="mini-btn preview-btn" data-url="${esc(url)}" data-type="${type}" data-title="${esc(labelFor(item,'Ресурс'))}">Преглед</button>`}
        <a class="icon-btn" href="${esc(url)}" download title="Изтегли">↓</a>
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
    return `<button class="gallery-tile" data-lightbox="${esc(url)}" data-caption="${esc(labelFor(item,'Изображение'))}">
      <img src="${esc(url)}" alt="${esc(labelFor(item,'Изображение'))}" loading="lazy">
      <span>${esc(labelFor(item,'Изображение'))}</span>
    </button>`;
  }).join('')}</div>`;
}
function videoSection(folder){
  const list = visible(pack.videos);
  if(!list.length) return '<div class="empty-state">Няма добавено видео.</div>';
  return `<div class="embedded-media-grid">${list.map(item=>{
    const url=fileUrl(folder,item.file);
    return `<article class="embedded-media-card"><video controls preload="metadata" src="${esc(url)}"></video><div><strong>${esc(labelFor(item,'Видео'))}</strong><small>${esc(item.description||'Видео материал към урока')}</small><a href="${esc(url)}" download>Изтегли видеото ↓</a></div></article>`;
  }).join('')}</div>`;
}
function audioSection(folder){
  const list = visible(pack.audio);
  if(!list.length) return '<div class="empty-state">Няма добавено аудио.</div>';
  return `<div class="audio-list">${list.map((item,i)=>{
    const url=fileUrl(folder,item.file);
    return `<article class="audio-card"><div class="audio-number">${i+1}</div><div class="audio-copy"><strong>${esc(labelFor(item,'Аудио'))}</strong><small>${esc(item.description||'Аудио материал към урока')}</small><audio controls preload="metadata" src="${esc(url)}"></audio></div><a class="icon-btn" href="${esc(url)}" download title="Изтегли">↓</a></article>`;
  }).join('')}</div>`;
}
function teacherMaterials(folder){
  const groups = [
    ['📘 План и методика', pack.methodology, '📘', 'methodology'],
    ['🗒️ Бележки на учителя', pack.teacherNotes, '🗒️', 'notes'],
    ['✅ Оценяване и обратна връзка', pack.assessment, '✅', 'assessment']
  ];
  const cards = groups.map(([title,items,icon,kind])=>{
    const list=visible(items);
    return `<article class="teacher-dashboard-card"><div class="teacher-dashboard-head"><h3>${title}</h3><span>${list.length}</span></div>${list.length?materialGrid(list,folder,icon,kind,''):'<div class="mini-empty">Предстои да бъде добавено.</div>'}</article>`;
  }).join('');
  return `<div class="teacher-dashboard">${cards}</div>`;
}
function tab(id, label, count=0, teacher=false){
  return `<button class="lesson-tab ${teacher?'teacher-only':''}" data-tab="${id}">${label}${count ? `<span>${count}</span>`:''}</button>`;
}
function panel(id, title, body, teacher=false){
  return `<section class="lesson-panel ${teacher?'teacher-only':''}" id="panel-${id}"><div class="panel-heading"><h2>${title}</h2></div>${body}</section>`;
}
function activate(id){
  if(id !== 'preview' && id !== 'related'){ visitedTabs.add(id); saveProgress(); }
  $$('.lesson-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
  $$('.lesson-panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${id}`));
  const target=$('.lesson-tabs-wrap');
  if(target) window.scrollTo({top:target.offsetTop-96,behavior:'smooth'});
  updateProgress();
}
function setMode(mode){
  teacherMode = mode === 'teacher';
  localStorage.setItem(modeKey(), mode);
  document.body.dataset.lessonMode = mode;
  $$('.mode-toggle button').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
  $$('.teacher-only').forEach(x=>x.classList.toggle('mode-hidden',!teacherMode));
  if(!teacherMode && $('.lesson-tab.active')?.classList.contains('teacher-only')) activate('overview');
}
function bind(){
  $$('.lesson-tab').forEach(x=>x.addEventListener('click',()=>activate(x.dataset.tab)));
  $$('.mode-toggle button').forEach(x=>x.addEventListener('click',()=>setMode(x.dataset.mode)));
  $('#conductButton')?.addEventListener('click',()=>activate('conduct'));
  $('#favoriteButton')?.addEventListener('click',toggleFavorite);
  $('#resetProgressButton')?.addEventListener('click',resetProgress);
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
  updateFavoriteButton();
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
        ? `<a class="mini-btn" href="${esc(url)}" target="_blank" rel="noopener">Отвори</a>`
        : `<button class="mini-btn preview-btn" data-url="${esc(url)}" data-type="${type}" data-title="${esc(step.title)}">Отвори</button>`;
    }
    return `<article class="conduct-step"><span>${i+1}</span><div><strong>${esc(step.title)}</strong><small>${esc(step.description||'')}</small></div>${action}</article>`;
  }).join('')}</div>`;
}
function relatedLessons(){
  const currentTags = new Set(arr(meta.tags).concat(arr(pack.tags)).map(x=>String(x).toLowerCase()));
  const scored = allResources.filter(x=>x.id!==meta.id).map(item=>{
    const tags=arr(item.tags).map(x=>String(x).toLowerCase());
    const score=tags.filter(t=>currentTags.has(t)).length + (item.subject===meta.subject?2:0) + (item.grade===meta.grade?1:0);
    return {item,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!scored.length) return `<div class="empty-state">Свързаните уроци ще се появят при добавяне на още учебни комплекти.</div>`;
  return `<div class="related-grid">${scored.map(({item})=>`<a class="related-card" href="${EMLS.url(`pages/lesson.html?id=${encodeURIComponent(item.id)}`)}"><span>${item.icon||'📚'}</span><div><small>${esc(item.subject)} · ${esc(item.grade)}. клас</small><strong>${esc(item.title)}</strong><p>${esc(item.description||'')}</p></div><b>→</b></a>`).join('')}</div>`;
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
  const duration=pack.duration||meta.duration||'40 минути';
  const audience=pack.audience||`${meta.grade}. клас`;
  const difficulty=pack.difficulty||'Средна трудност';

  const tabs = [
    tab('overview','🏠 Преглед'), tab('conduct','🎓 Проведи урок'),
    presentations.length ? tab('presentations','📊 Презентации',presentations.length) : '',
    worksheets.length ? tab('worksheets','📝 Работни листове',worksheets.length) : '',
    images.length ? tab('gallery','🖼️ Галерия',images.length) : '',
    videos.length ? tab('video','🎥 Видео',videos.length) : '',
    audio.length ? tab('audio','🎵 Аудио',audio.length) : '',
    teacher ? tab('teacher','👩‍🏫 Учителски център',teacher,true) : '',
    valid(pack.download) ? tab('download','📦 Изтегляне') : '',
    tab('related','⭐ Свързани'), tab('preview','🔎 Преглед')
  ].filter(Boolean).join('');

  const summary = [
    ['⏱️',duration,'Продължителност'], ['👥',audience,'Подходящо за'], ['🎯',difficulty,'Ниво'],
    ['🎮',meta.game?1:0,'Игра'], ['📚',presentations.length+worksheets.length+videos.length+audio.length+images.length,'Учебни ресурси'], ['👩‍🏫',teacher,'За учителя']
  ].filter(x=>x[1]!==0);

  app.innerHTML=`
  <section class="lesson-page">
    <div class="container">
      <div class="lesson-breadcrumbs"><a href="${EMLS.url('index.html')}">Начало</a> › <a href="${EMLS.url('pages/library.html')}">Библиотека</a> › ${esc(meta.title)}</div>

      <section class="lesson-hero ${cover?'has-cover':''}" ${cover?`style="--lesson-cover:url('${esc(cover)}')"`:''}>
        <div class="lesson-hero-overlay"></div>
        <div class="lesson-hero-content">
          <div class="lesson-kicker"><span>${esc(meta.subject)}</span><span>${esc(meta.grade)}. клас</span><span>${esc(pack.lessonType||meta.type||'Учебен комплект')}</span></div>
          <h1>${esc(meta.title)}</h1>
          <p class="lead">${esc(pack.description||meta.description||'')}</p>
          <div class="lesson-actions">
            <button class="primary-btn conduct-main" id="conductButton">▶ Проведи урока</button>
            ${meta.game?`<a class="secondary-btn hero-secondary" href="${EMLS.url(meta.game)}">🎮 Стартирай играта</a>`:''}
            ${valid(pack.download)?`<a class="secondary-btn hero-secondary" href="${esc(fileUrl(folder,pack.download.file))}" download>⬇ Изтегли комплекта</a>`:''}
            <button class="secondary-btn hero-secondary favorite-btn" id="favoriteButton" type="button" aria-pressed="false">☆ Добави в любими</button>
          </div>
          <div class="hero-progress">
            <div class="hero-progress-top"><span>Напредък по урока</span><strong id="lessonProgressLabel">0% завършено</strong></div>
            <div class="hero-progress-track"><span id="lessonProgressBar"></span></div>
            <button id="resetProgressButton" type="button">Нулирай напредъка</button>
          </div>
          <div class="mode-switch"><span>Режим:</span><div class="mode-toggle"><button class="active" data-mode="teacher">👩‍🏫 Учител</button><button data-mode="student">👨‍🎓 Ученик</button></div></div>
        </div>
        <div class="lesson-cover-card">${cover?`<img src="${esc(cover)}" alt="Корица: ${esc(meta.title)}">`:`<div class="lesson-cover-fallback">${pack.icon||meta.icon||'📚'}</div>`}<span class="lesson-code">${esc(meta.id)}</span></div>
      </section>

      <div class="lesson-summary">${summary.map(x=>`<div class="summary-card"><span>${x[0]}</span><div><strong>${esc(x[1])}</strong><small>${esc(x[2])}</small></div></div>`).join('')}</div>
      <div class="lesson-tabs-wrap"><div class="lesson-tabs">${tabs}</div></div>

      ${panel('overview','📖 За урока',`<div class="overview-grid"><div class="overview-main"><p class="overview-text">${esc(pack.description||meta.description||'')}</p><div class="soft-card"><h3>🎯 Учебни цели</h3>${objectives.length?`<ul>${objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Предстои да бъдат добавени.</p>'}</div></div><aside class="overview-side"><div class="soft-card"><h3>🧠 Компетентности</h3>${competencies.length?`<div class="competency-chips">${competencies.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'<p>Предстои да бъдат добавени.</p>'}</div><div class="soft-card"><h3>🛠️ Необходими материали</h3>${materials.length?`<ul>${materials.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>Компютър и интерактивен дисплей.</p>'}</div><div class="resource-badges">${tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div></aside></div>`)}
      ${panel('conduct','🎓 Проведи урока стъпка по стъпка',conduct(folder))}
      ${presentations.length?panel('presentations','📊 Презентации',materialGrid(presentations,folder,'📊','presentation','')):''}
      ${worksheets.length?panel('worksheets','📝 Работни листове',materialGrid(worksheets,folder,'📝','worksheet','')):''}
      ${images.length?panel('gallery','🖼️ Галерия',gallery(folder)):''}
      ${videos.length?panel('video','🎥 Видео',videoSection(folder)):''}
      ${audio.length?panel('audio','🎵 Аудио',audioSection(folder)):''}
      ${teacher?panel('teacher','👩‍🏫 Учителски център',teacherMaterials(folder),true):''}
      ${valid(pack.download)?panel('download','📦 Изтегляне',materialGrid([pack.download],folder,'⬇️','download','')):''}
      ${panel('related','⭐ Свързани уроци',relatedLessons())}
      ${panel('preview','🔎 Преглед на ресурс','<h3 id="previewTitle">Избери материал</h3><div class="media-viewer" id="previewViewer"><div class="empty-state">Избери бутон „Преглед“.</div></div>')}
    </div>
  </section>`;
  activate('overview'); bind();
}
async function init(){
  setupTheme();
  const id=new URLSearchParams(location.search).get('id');
  const app=$('#lessonApp');
  try{
    if(!id) throw new Error('missing id');
    const resourcesResponse = await fetch(EMLS.url('data/resources.json'), {cache:'no-store'});
    if(!resourcesResponse.ok) throw new Error(`resources.json: HTTP ${resourcesResponse.status}`);
    allResources = await resourcesResponse.json();

    meta=allResources.find(x=>x.id===id);
    if(!meta) throw new Error(`Учебният комплект ${id} не е намерен.`);

    if(meta.packManifest){
      const packResponse = await fetch(EMLS.url(meta.packManifest), {cache:'no-store'});
      if(!packResponse.ok) throw new Error(`pack.json: HTTP ${packResponse.status}`);
      pack = await packResponse.json();
    }else{
      pack = {};
    }
    document.title=`${meta.title} | EM Learning Studio`;
    loadProgress();
    render();
  }catch(err){
    console.error(err);
    app.innerHTML=`<section class="lesson-page"><div class="container"><div class="error-card"><h1>Комплектът не може да бъде зареден</h1><p>Провери pack.json и пътищата към файловете.</p><a class="primary-btn" href="${EMLS.url('pages/library.html')}">Към библиотеката</a></div></div></section>`;
  }
}
init();
