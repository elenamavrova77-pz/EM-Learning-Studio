(() => {
  'use strict';

  let resources = [];
  const FAVORITES_KEY = 'emls:favorites:v1';

  function url(path = '') {
    if (window.EMLS?.url) return window.EMLS.url(path);
    return new URL(String(path).replace(/^\/+/, ''), document.baseURI).href;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getThemeClass(theme) {
    return theme === 'teal' ? 'theme-teal'
      : theme === 'purple' ? 'theme-purple'
      : theme === 'orange' ? 'theme-orange'
      : 'theme-default';
  }

  function normalise(item) {
    const grade = Number.parseInt(item.grade, 10);
    return {
      ...item,
      id: String(item.id || ''),
      title: String(item.title || 'Учебен ресурс'),
      subject: String(item.subject || ''),
      subjectCode: String(item.subjectCode || '').toLowerCase(),
      grade: Number.isFinite(grade) ? grade : '',
      description: String(item.description || ''),
      tags: Array.isArray(item.tags) ? item.tags : [],
      published: item.published !== false,
      featured: item.featured === true,
      lessonUrl: item.lessonUrl || `pages/lesson.html?id=${encodeURIComponent(item.id || '')}`,
      updated: item.updated || item.created || ''
    };
  }

  function getFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites(set) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  }

  function toggleFavorite(id) {
    const favorites = getFavorites();
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites(favorites);
    renderLibrary();
  }

  function availableResourceLabels(item) {
    const labels = [];
    if (item.game) labels.push('🎮 Игра');
    if (item.packManifest || item.resourceFolder) labels.push('📦 Комплект');
    if (item.presentation) labels.push('📊 Презентация');
    if (item.worksheet) labels.push('📄 Работен лист');
    if (item.video) labels.push('🎥 Видео');
    return labels;
  }

  function resourceCard(item, favorites) {
    const isFavorite = favorites.has(item.id);
    const labels = availableResourceLabels(item);
    const updatedText = item.updated
      ? new Intl.DateTimeFormat('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' })
          .format(new Date(`${item.updated}T00:00:00`))
      : '';

    return `
      <article class="resource-card library-card">
        <div class="resource-cover ${getThemeClass(item.theme)}">
          <span class="resource-icon">${escapeHtml(item.icon || '📚')}</span>
          <span class="resource-code">${escapeHtml(item.id)}</span>
          ${item.featured ? '<span class="featured-ribbon">Препоръчан</span>' : ''}
          <button class="favorite-button ${isFavorite ? 'is-favorite' : ''}"
                  type="button"
                  data-favorite-id="${escapeHtml(item.id)}"
                  aria-label="${isFavorite ? 'Премахни от любими' : 'Добави в любими'}"
                  title="${isFavorite ? 'Премахни от любими' : 'Добави в любими'}">
            ${isFavorite ? '♥' : '♡'}
          </button>
        </div>
        <div class="resource-card-body">
          <div class="resource-meta">
            <span>${escapeHtml(item.subject)}</span>
            ${item.grade ? `<span>${item.grade}. клас</span>` : ''}
            ${item.duration ? `<span>⏱ ${escapeHtml(item.duration)}</span>` : ''}
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="resource-badges">
            ${labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}
            ${item.difficulty ? `<span>🎯 ${escapeHtml(item.difficulty)}</span>` : ''}
          </div>
          ${updatedText ? `<div class="resource-updated">Обновено: ${escapeHtml(updatedText)}</div>` : ''}
          <div class="resource-actions">
            <a class="primary-btn" href="${url(item.lessonUrl)}">📦 Отвори комплекта</a>
            ${item.game ? `<a class="secondary-btn" href="${url(item.game)}">▶ Играй</a>` : ''}
          </div>
        </div>
      </article>`;
  }

  function getFilteredResources() {
    const term = (document.getElementById('resourceSearch')?.value || '').trim().toLocaleLowerCase('bg');
    const subject = document.getElementById('subjectFilter')?.value || 'all';
    const grade = document.getElementById('gradeFilter')?.value || 'all';
    const sort = document.getElementById('sortFilter')?.value || 'updated-desc';
    const featuredOnly = document.getElementById('featuredOnly')?.checked || false;
    const favoritesOnly = document.getElementById('favoritesOnly')?.checked || false;
    const favorites = getFavorites();

    const filtered = resources.filter(item => {
      const haystack = [
        item.id, item.title, item.subject, item.description,
        item.type, item.difficulty, ...(item.tags || [])
      ].join(' ').toLocaleLowerCase('bg');

      return item.published
        && (subject === 'all' || item.subjectCode === subject)
        && (grade === 'all' || String(item.grade) === grade)
        && (!featuredOnly || item.featured)
        && (!favoritesOnly || favorites.has(item.id))
        && haystack.includes(term);
    });

    const collator = new Intl.Collator('bg', { sensitivity: 'base' });
    filtered.sort((a, b) => {
      if (sort === 'title-asc') return collator.compare(a.title, b.title);
      if (sort === 'grade-asc') return (Number(a.grade) || 99) - (Number(b.grade) || 99) || collator.compare(a.title, b.title);
      if (sort === 'subject-asc') return collator.compare(a.subject, b.subject) || collator.compare(a.title, b.title);
      return String(b.updated || '').localeCompare(String(a.updated || '')) || collator.compare(a.title, b.title);
    });

    return { filtered, favorites };
  }

  function updateSummary() {
    const published = resources.filter(item => item.published);
    const subjects = new Set(published.map(item => item.subjectCode).filter(Boolean));
    const featured = published.filter(item => item.featured).length;

    const totalEl = document.getElementById('libraryTotal');
    const subjectsEl = document.getElementById('librarySubjects');
    const featuredEl = document.getElementById('libraryFeatured');
    if (totalEl) totalEl.textContent = String(published.length);
    if (subjectsEl) subjectsEl.textContent = String(subjects.size);
    if (featuredEl) featuredEl.textContent = String(featured);
  }

  function renderLibrary() {
    const grid = document.getElementById('resourceGrid');
    if (!grid) return;

    const { filtered, favorites } = getFilteredResources();
    grid.innerHTML = filtered.map(item => resourceCard(item, favorites)).join('');

    const empty = document.getElementById('resourceEmpty');
    empty?.classList.toggle('hidden', filtered.length > 0);

    const count = document.getElementById('resourceCount');
    if (count) {
      const total = resources.filter(item => item.published).length;
      count.textContent = `Показани ${filtered.length} от ${total}`;
    }

    grid.querySelectorAll('[data-favorite-id]').forEach(button => {
      button.addEventListener('click', () => toggleFavorite(button.dataset.favoriteId));
    });
  }

  function resetLibraryFilters() {
    const search = document.getElementById('resourceSearch');
    const subject = document.getElementById('subjectFilter');
    const grade = document.getElementById('gradeFilter');
    const sort = document.getElementById('sortFilter');
    const featured = document.getElementById('featuredOnly');
    const favorites = document.getElementById('favoritesOnly');

    if (search) search.value = '';
    if (subject) subject.value = 'all';
    if (grade) grade.value = 'all';
    if (sort) sort.value = 'updated-desc';
    if (featured) featured.checked = false;
    if (favorites) favorites.checked = false;
    renderLibrary();
  }

  function fileButton(label, resourcePath, icon) {
    if (resourcePath) {
      return `<a class="pack-file available" href="${url(resourcePath)}"><span>${icon}</span><div><strong>${escapeHtml(label)}</strong><small>Отвори ресурса</small></div><b>→</b></a>`;
    }
    return `<div class="pack-file unavailable"><span>${icon}</span><div><strong>${escapeHtml(label)}</strong><small>Предстои да бъде добавен</small></div><b>—</b></div>`;
  }

  function renderPack() {
    const root = document.getElementById('packRoot');
    if (!root) return;

    const id = new URLSearchParams(location.search).get('id');
    const item = resources.find(entry => entry.id === id);

    if (!item) {
      root.innerHTML = `<section class="page-hero"><div class="container"><h1>Ресурсът не е намерен</h1><p>Провери адреса или се върни към библиотеката.</p><a class="primary-btn" href="${url('pages/library.html')}">Към библиотеката</a></div></section>`;
      return;
    }

    document.title = `${item.title} | EM Learning Studio`;
    root.innerHTML = `
      <section class="pack-page">
        <div class="container">
          <div class="breadcrumbs"><a href="${url('index.html')}">Начало</a> › <a href="${url('pages/library.html')}">Библиотека</a> › ${escapeHtml(item.title)}</div>
          <div class="pack-header">
            <div class="pack-cover ${getThemeClass(item.theme)}">
              <span class="resource-icon">${escapeHtml(item.icon || '📚')}</span>
              <span class="resource-code">${escapeHtml(item.id)}</span>
            </div>
            <div class="pack-intro">
              <div class="resource-meta">
                <span>${escapeHtml(item.subject)}</span>
                ${item.grade ? `<span>${item.grade}. клас</span>` : ''}
                ${item.duration ? `<span>${escapeHtml(item.duration)}</span>` : ''}
                ${item.difficulty ? `<span>${escapeHtml(item.difficulty)}</span>` : ''}
              </div>
              <h1>${escapeHtml(item.title)}</h1>
              <p>${escapeHtml(item.description)}</p>
              <div class="resource-actions">
                ${item.game ? `<a class="primary-btn" href="${url(item.game)}">▶ Стартирай играта</a>` : ''}
                <a class="secondary-btn" href="${url('pages/library.html')}">← Към библиотеката</a>
              </div>
            </div>
          </div>
          <div class="pack-content">
            <article class="pack-section">
              <h2>🎯 Учебни цели</h2>
              <ul>${(item.objectives || []).map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>
              <h2>🏷️ Ключови думи</h2>
              <div class="resource-badges">${(item.tags || []).map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>
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

  async function initPlatform() {
    try {
      const response = await fetch(url('data/resources.json'), { cache: 'no-store' });
      if (!response.ok) throw new Error(`resources.json: HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('resources.json трябва да съдържа масив.');
      resources = data.map(normalise);
    } catch (error) {
      console.error('EM Learning Studio: ресурсите не се заредиха.', error);
      resources = [];
      const empty = document.getElementById('resourceEmpty');
      if (empty) {
        empty.classList.remove('hidden');
        empty.innerHTML = '<div class="empty-icon">⚠️</div><h3>Ресурсите не могат да бъдат заредени</h3><p>Провери data/resources.json и опитай отново.</p>';
      }
    }

    updateSummary();
    renderLibrary();
    renderPack();

    ['resourceSearch', 'subjectFilter', 'gradeFilter', 'sortFilter', 'featuredOnly', 'favoritesOnly']
      .forEach(id => {
        const element = document.getElementById(id);
        element?.addEventListener('input', renderLibrary);
        element?.addEventListener('change', renderLibrary);
      });

    document.getElementById('resetLibraryFilters')?.addEventListener('click', resetLibraryFilters);
    document.getElementById('emptyReset')?.addEventListener('click', resetLibraryFilters);
  }

  initPlatform();
})();
