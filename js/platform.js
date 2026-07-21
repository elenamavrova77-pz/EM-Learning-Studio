
let resources = [];

function getThemeClass(theme){
  return theme === 'teal' ? 'theme-teal'
       : theme === 'purple' ? 'theme-purple'
       : theme === 'orange' ? 'theme-orange'
       : 'theme-default';
}

function resourceCard(item){
  const available = [
    item.game ? '🎮 Игра' : '',
    item.presentation ? '📊 Презентация' : '',
    item.worksheet ? '📄 Работен лист' : '',
    item.methodology ? '📘 Методика' : ''
  ].filter(Boolean);

  return `
    <article class="resource-card">
      <div class="resource-cover ${getThemeClass(item.theme)}">
        <span class="resource-icon">${item.icon || '📚'}</span>
        <span class="resource-code">${item.id}</span>
      </div>
      <div class="resource-card-body">
        <div class="resource-meta">
          <span>${item.subject}</span>
          <span>${item.grade}. клас</span>
          <span>${item.duration}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="resource-badges">
          ${available.map(x => `<span>${x}</span>`).join('')}
        </div>
        <div class="resource-actions">
          <a class="primary-btn" href="${EMLS.url(item.lessonUrl || `pages/lesson.html?id=${encodeURIComponent(item.id)}`)}">📦 Отвори комплекта</a>
          ${item.game ? `<a class="secondary-btn" href="${EMLS.url(item.game)}">▶ Играй</a>` : ''}
        </div>
      </div>
    </article>`;
}

function renderLibrary(){
  const grid = document.getElementById('resourceGrid');
  if(!grid) return;

  const term = (document.getElementById('resourceSearch')?.value || '').trim().toLowerCase();
  const subject = document.getElementById('subjectFilter')?.value || 'all';
  const grade = document.getElementById('gradeFilter')?.value || 'all';

  const filtered = resources.filter(item => {
    const text = [item.id,item.title,item.subject,item.description,...(item.tags || [])].join(' ').toLowerCase();
    return item.published !== false
      && (subject === 'all' || item.subjectCode === subject)
      && (grade === 'all' || String(item.grade) === grade)
      && text.includes(term);
  });

  grid.innerHTML = filtered.map(resourceCard).join('');
  document.getElementById('resourceEmpty')?.classList.toggle('hidden', filtered.length > 0);
}

function fileButton(label, url, icon){
  if(url){
    return `<a class="pack-file available" href="${EMLS.url(url)}"><span>${icon}</span><div><strong>${label}</strong><small>Отвори ресурса</small></div><b>→</b></a>`;
  }
  return `<div class="pack-file unavailable"><span>${icon}</span><div><strong>${label}</strong><small>Предстои да бъде добавен</small></div><b>—</b></div>`;
}

function renderPack(){
  const root = document.getElementById('packRoot');
  if(!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const item = resources.find(x => x.id === id);

  if(!item){
    root.innerHTML = `<section class="page-hero"><div class="container"><h1>Ресурсът не е намерен</h1><p>Провери адреса или се върни към библиотеката.</p><a class="primary-btn" href="${EMLS.url('pages/library.html')}">Към библиотеката</a></div></section>`;
    return;
  }

  document.title = `${item.title} | EM Learning Studio`;

  root.innerHTML = `
    <section class="pack-page">
      <div class="container">
        <div class="breadcrumbs"><a href="${EMLS.url('index.html')}">Начало</a> › <a href="${EMLS.url('pages/library.html')}">Библиотека</a> › ${item.title}</div>

        <div class="pack-header">
          <div class="pack-cover ${getThemeClass(item.theme)}">
            <span class="resource-icon">${item.icon || '📚'}</span>
            <span class="resource-code">${item.id}</span>
          </div>
          <div class="pack-intro">
            <div class="resource-meta">
              <span>${item.subject}</span>
              <span>${item.grade}. клас</span>
              <span>${item.duration}</span>
              <span>${item.difficulty}</span>
            </div>
            <h1>${item.title}</h1>
            <p>${item.description}</p>
            <div class="resource-actions">
              ${item.game ? `<a class="primary-btn" href="${EMLS.url(item.game)}">▶ Стартирай играта</a>` : ''}
              <a class="secondary-btn" href="${EMLS.url('pages/library.html')}">← Към библиотеката</a>
            </div>
          </div>
        </div>

        <div class="pack-content">
          <article class="pack-section">
            <h2>🎯 Учебни цели</h2>
            <ul>${(item.objectives || []).map(x => `<li>${x}</li>`).join('')}</ul>

            <h2>🏷️ Ключови думи</h2>
            <div class="resource-badges">${(item.tags || []).map(x => `<span>${x}</span>`).join('')}</div>
          </article>

          <aside class="pack-files">
            <h2>Съдържание на комплекта</h2>
            ${fileButton('Интерактивна игра', item.game, '🎮')}
            ${fileButton('Презентация', item.presentation, '📊')}
            ${fileButton('Работен лист', item.worksheet, '📄')}
            ${fileButton('Методическа разработка', item.methodology, '📘')}
            ${fileButton('Критерии за оценяване', item.assessment, '✅')}
            ${fileButton('Видео', item.video, '🎥')}
            ${fileButton('Изтегли целия комплект', item.download, '⬇️')}
          </aside>
        </div>
      </div>
    </section>`;
}

async function initPlatform(){
  try{
    const response = await fetch(EMLS.url('data/resources.json'), {cache:'no-store'});
    resources = await response.json();
  }catch(error){
    console.error('Resources failed to load:', error);
    resources = [];
  }

  renderLibrary();
  renderPack();

  ['resourceSearch','subjectFilter','gradeFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderLibrary);
    document.getElementById(id)?.addEventListener('change', renderLibrary);
  });
}

initPlatform();
