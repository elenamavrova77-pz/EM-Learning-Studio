
let lessonMeta = null;
let lessonPack = null;
let teacherMode = true;

const qs = (selector, root=document) => root.querySelector(selector);
const qsa = (selector, root=document) => [...root.querySelectorAll(selector)];

function safeArray(value){ return Array.isArray(value) ? value : []; }
function isUrl(value){ return typeof value === 'string' && value.trim().length > 0; }

function absoluteFromFolder(folder, file){
  if(!file) return '';
  if(file.startsWith('http://') || file.startsWith('https://') || file.startsWith('/')) return file;
  return `${folder.replace(/\/$/,'')}/${file.replace(/^\//,'')}`;
}

function mediaType(file=''){
  const lower = file.toLowerCase().split('?')[0];
  if(/\.(png|jpg|jpeg|webp|gif|svg)$/.test(lower)) return 'image';
  if(/\.(mp4|webm|ogg)$/.test(lower)) return 'video';
  if(/\.(mp3|wav|m4a|aac|oga)$/.test(lower)) return 'audio';
  if(/\.pdf$/.test(lower)) return 'pdf';
  return 'file';
}

function resourceItem(item, folder, emoji='📄'){
  const url = absoluteFromFolder(folder, item.file);
  const target = item.embed === false ? '_blank' : '_self';
  return `
    <a class="resource-item" href="${url}" data-preview="${item.embed === false ? 'false' : 'true'}" data-type="${mediaType(url)}" target="${target}">
      <span class="resource-emoji">${item.icon || emoji}</span>
      <span>
        <strong>${item.title || 'Ресурс'}</strong>
        <small>${item.description || 'Отвори материала'}</small>
      </span>
      <span class="open-arrow">→</span>
    </a>`;
}

function listOrEmpty(items, folder, emoji, emptyText){
  const arr = safeArray(items).filter(x => x && isUrl(x.file));
  if(!arr.length) return `<div class="empty-state">${emptyText}</div>`;
  return `<div class="resource-list">${arr.map(x => resourceItem(x, folder, emoji)).join('')}</div>`;
}

function tabButton(id, label, teacherOnly=false){
  return `<button class="lesson-tab ${teacherOnly ? 'teacher-only' : ''}" data-tab="${id}">${label}</button>`;
}

function panel(id, content, teacherOnly=false){
  return `<section class="lesson-panel ${teacherOnly ? 'teacher-only' : ''}" id="panel-${id}">${content}</section>`;
}

function setMode(mode){
  teacherMode = mode === 'teacher';
  qsa('.mode-toggle button').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  qsa('.teacher-only').forEach(el => el.classList.toggle('hidden-by-mode', !teacherMode));

  const activeTab = qs('.lesson-tab.active');
  if(activeTab && activeTab.classList.contains('hidden-by-mode')){
    activateTab('overview');
  }
}

function activateTab(tabId){
  qsa('.lesson-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  qsa('.lesson-panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${tabId}`));
  window.scrollTo({top: qs('.lesson-tabs-wrap').offsetTop - 100, behavior:'smooth'});
}

function showPreview(url, type, title){
  const viewer = qs('#mediaViewer');
  const panel = qs('#panel-preview');
  if(!viewer || !panel) return;

  let html = '';
  if(type === 'image') html = `<img src="${url}" alt="${title || 'Изображение'}">`;
  else if(type === 'video') html = `<video controls src="${url}"></video>`;
  else if(type === 'audio') html = `<audio controls src="${url}"></audio>`;
  else if(type === 'pdf') html = `<iframe src="${url}" title="${title || 'PDF документ'}"></iframe>`;
  else html = `<div class="empty-state"><a class="primary-btn" href="${url}" target="_blank">Отвори файла</a></div>`;

  viewer.innerHTML = html;
  qs('#previewTitle').textContent = title || 'Преглед на ресурс';
  activateTab('preview');
}

function renderGallery(items, folder){
  const images = safeArray(items).filter(x => x && isUrl(x.file));
  if(!images.length) return `<div class="empty-state">Все още няма добавени изображения или инфографики.</div>`;
  return `<div class="lesson-gallery">${images.map(item => {
    const url = absoluteFromFolder(folder, item.file);
    return `<a class="gallery-card" href="${url}" data-preview="true" data-type="image">
      <img src="${url}" alt="${item.title || 'Изображение'}">
      <div>${item.title || 'Изображение'}</div>
    </a>`;
  }).join('')}</div>`;
}

function conductSteps(pack, folder){
  const flow = safeArray(pack.conductLesson);
  if(!flow.length) return `<div class="empty-state">Последователността за провеждане на урока предстои да бъде добавена.</div>`;

  return `<div class="conduct-flow">${flow.map((step,index) => {
    const fileUrl = step.file ? absoluteFromFolder(folder, step.file) : '';
    const action = fileUrl
      ? `<a class="secondary-btn" href="${fileUrl}" ${step.embed === false ? 'target="_blank"' : `data-preview="true" data-type="${mediaType(fileUrl)}"`}>Отвори</a>`
      : step.game && lessonMeta.game
        ? `<a class="secondary-btn" href="${lessonMeta.game}">Стартирай</a>`
        : '';
    return `<div class="conduct-step">
      <span class="number">${index + 1}</span>
      <span><strong>${step.title}</strong><small>${step.description || ''}</small></span>
      ${action}
    </div>`;
  }).join('')}</div>`;
}

function renderLesson(){
  const app = qs('#lessonApp');
  const folder = lessonMeta.resourceFolder || '';
  const pack = lessonPack || {};
  const cover = isUrl(pack.cover) ? absoluteFromFolder(folder, pack.cover) : '';
  const icon = pack.icon || lessonMeta.icon || '📚';

  document.title = `${lessonMeta.title} | EM Learning Studio`;

  const objectives = safeArray(pack.objectives?.length ? pack.objectives : lessonMeta.objectives);
  const competencies = safeArray(pack.competencies);
  const materials = safeArray(pack.materials);
  const tags = safeArray(pack.tags?.length ? pack.tags : lessonMeta.tags);

  const tabs = [
    tabButton('overview','🏠 Преглед'),
    tabButton('conduct','🎓 Проведи урок'),
    tabButton('presentations',`📊 Презентации (${safeArray(pack.presentations).length})`),
    tabButton('worksheets',`📝 Работни листове (${safeArray(pack.worksheets).length})`),
    tabButton('gallery',`🖼️ Галерия (${safeArray(pack.images).length})`),
    tabButton('video',`🎥 Видео (${safeArray(pack.videos).length})`),
    tabButton('audio',`🎵 Аудио (${safeArray(pack.audio).length})`),
    tabButton('methodology',`📘 Методика (${safeArray(pack.methodology).length})`,true),
    tabButton('teacherNotes',`👩‍🏫 Бележки (${safeArray(pack.teacherNotes).length})`,true),
    tabButton('assessment',`📋 Оценяване (${safeArray(pack.assessment).length})`,true),
    tabButton('download','📦 Изтегляне'),
    tabButton('preview','🔎 Преглед')
  ].join('');

  const overview = `
    <div class="lesson-two-col">
      <div>
        <h2>📖 За урока</h2>
        <p>${pack.description || lessonMeta.description || ''}</p>
        <div class="info-box">
          <h3>🎯 Учебни цели</h3>
          ${objectives.length ? `<ul>${objectives.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p>Предстои да бъдат добавени.</p>'}
        </div>
      </div>
      <div>
        <div class="info-box">
          <h3>🧠 Компетентности</h3>
          ${competencies.length ? `<ul>${competencies.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p>Предстои да бъдат добавени.</p>'}
        </div>
        <div class="info-box" style="margin-top:16px">
          <h3>🛠️ Необходими материали</h3>
          ${materials.length ? `<ul>${materials.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p>Компютър, проектор или интерактивен дисплей.</p>'}
        </div>
        <div class="resource-badges" style="margin-top:16px">${tags.map(x => `<span>${x}</span>`).join('')}</div>
      </div>
    </div>`;

  app.innerHTML = `
    <section class="lesson-page">
      <div class="container">
        <div class="lesson-breadcrumbs">
          <a href="/">Начало</a> › <a href="/pages/library.html">Библиотека</a> › ${lessonMeta.title}
        </div>

        <div class="lesson-hero">
          <div class="lesson-cover">
            ${cover ? `<img src="${cover}" alt="Корица на ${lessonMeta.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}
            <div class="lesson-cover-fallback" style="${cover ? 'display:none' : ''}">${icon}</div>
            <span class="lesson-code">${lessonMeta.id}</span>
          </div>

          <div class="lesson-intro">
            <div class="lesson-kicker">
              <span>${lessonMeta.subject}</span>
              <span>${lessonMeta.grade}. клас</span>
              <span>${pack.duration || lessonMeta.duration || '40 минути'}</span>
              <span>${pack.lessonType || lessonMeta.type || 'Учебен комплект'}</span>
            </div>
            <h1>${lessonMeta.title}</h1>
            <p class="lead">${pack.description || lessonMeta.description || ''}</p>

            <div class="lesson-actions">
              ${lessonMeta.game ? `<a class="primary-btn" href="${lessonMeta.game}">▶ Стартирай играта</a>` : ''}
              <button class="secondary-btn" type="button" id="conductButton">🎓 Проведи урок</button>
              <a class="secondary-btn" href="/pages/library.html">← Към библиотеката</a>
            </div>

            <div class="mode-switch">
              <span>Режим:</span>
              <div class="mode-toggle">
                <button type="button" class="active" data-mode="teacher">👩‍🏫 Учител</button>
                <button type="button" data-mode="student">👨‍🎓 Ученик</button>
              </div>
            </div>
          </div>
        </div>

        <div class="lesson-summary">
          <div class="summary-card"><span class="summary-icon">🎮</span><div><strong>${lessonMeta.game ? 'Има игра' : 'Без игра'}</strong><small>Интерактивен ресурс</small></div></div>
          <div class="summary-card"><span class="summary-icon">📊</span><div><strong>${safeArray(pack.presentations).length} презентации</strong><small>Учебни материали</small></div></div>
          <div class="summary-card"><span class="summary-icon">📝</span><div><strong>${safeArray(pack.worksheets).length} работни листа</strong><small>Задачи и упражнения</small></div></div>
          <div class="summary-card"><span class="summary-icon">🎥</span><div><strong>${safeArray(pack.videos).length} видеа</strong><small>Мултимедийно съдържание</small></div></div>
          <div class="summary-card"><span class="summary-icon">📘</span><div><strong>${safeArray(pack.methodology).length} методически</strong><small>Материали за учителя</small></div></div>
        </div>

        <div class="lesson-tabs-wrap">
          <div class="lesson-tabs">${tabs}</div>
        </div>

        ${panel('overview',overview)}
        ${panel('conduct',`<h2>🎓 Проведи урок</h2>${conductSteps(pack,folder)}`)}
        ${panel('presentations',`<h2>📊 Презентации</h2>${listOrEmpty(pack.presentations,folder,'📊','Все още няма добавени презентации.')}`)}
        ${panel('worksheets',`<h2>📝 Работни листове</h2>${listOrEmpty(pack.worksheets,folder,'📝','Все още няма добавени работни листове.')}`)}
        ${panel('gallery',`<h2>🖼️ Изображения и инфографики</h2>${renderGallery(pack.images,folder)}`)}
        ${panel('video',`<h2>🎥 Видео</h2>${listOrEmpty(pack.videos,folder,'🎥','Все още няма добавено видео.')}`)}
        ${panel('audio',`<h2>🎵 Аудио</h2>${listOrEmpty(pack.audio,folder,'🎵','Все още няма добавено аудио.')}`)}
        ${panel('methodology',`<h2>📘 Методически материали</h2>${listOrEmpty(pack.methodology,folder,'📘','Все още няма добавени методически материали.')}`,true)}
        ${panel('teacherNotes',`<h2>👩‍🏫 Бележки за учителя</h2>${listOrEmpty(pack.teacherNotes,folder,'👩‍🏫','Все още няма добавени бележки за учителя.')}`,true)}
        ${panel('assessment',`<h2>📋 Оценяване</h2>${listOrEmpty(pack.assessment,folder,'📋','Материалите за оценяване ще бъдат добавени по-късно.')}`,true)}
        ${panel('download',`<h2>📦 Изтегляне на комплекта</h2>${pack.download && pack.download.file ? listOrEmpty([pack.download],folder,'⬇️','') : '<div class="empty-state">Пълният ZIP комплект ще бъде добавен, когато всички материали са готови.</div>'}`)}
        ${panel('preview',`<h2 id="previewTitle">🔎 Преглед на ресурс</h2><div id="mediaViewer" class="media-viewer"><div class="empty-state">Избери материал, за да го прегледаш тук.</div></div>`)}
      </div>
    </section>`;

  activateTab('overview');

  qsa('.lesson-tab').forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  qsa('.mode-toggle button').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  qs('#conductButton')?.addEventListener('click', () => activateTab('conduct'));

  qsa('[data-preview="true"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      showPreview(link.getAttribute('href'), link.dataset.type, link.querySelector('strong')?.textContent || link.textContent.trim());
    });
  });
}

async function initLesson(){
  const id = new URLSearchParams(location.search).get('id');
  const app = qs('#lessonApp');

  if(!id){
    app.innerHTML = `<section class="lesson-page"><div class="container"><div class="error-card"><h1>Липсва код на учебния комплект</h1><a class="primary-btn" href="/pages/library.html">Към библиотеката</a></div></div></section>`;
    return;
  }

  try{
    const resourcesResponse = await fetch('/data/resources.json',{cache:'no-store'});
    const resources = await resourcesResponse.json();
    lessonMeta = resources.find(item => item.id === id);

    if(!lessonMeta) throw new Error('Resource not found');

    if(lessonMeta.packManifest){
      const packResponse = await fetch(lessonMeta.packManifest,{cache:'no-store'});
      if(packResponse.ok) lessonPack = await packResponse.json();
      else lessonPack = {};
    }else{
      lessonPack = {};
    }

    renderLesson();
  }catch(error){
    console.error(error);
    app.innerHTML = `<section class="lesson-page"><div class="container"><div class="error-card"><h1>Учебният комплект не може да бъде зареден</h1><p>Провери дали записът и pack.json са на правилното място.</p><a class="primary-btn" href="/pages/library.html">Към библиотеката</a></div></div></section>`;
  }
}

initLesson();
