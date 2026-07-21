(() => {
  'use strict';

  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const search = document.getElementById('search');

  let catalog = [];
  let activeSubject = document.querySelector('.filter[data-filter].active')?.dataset.filter || 'all';
  let activeGrade = document.querySelector('.grade-filter[data-grade].active')?.dataset.grade || 'all';

  function rootUrl(path = '') {
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

  function themeClass(theme) {
    return ['teal', 'purple', 'orange'].includes(theme) ? theme : '';
  }

  function normalise(item) {
    return {
      ...item,
      subjectCode: item.subjectCode || item.subject || '',
      subjectLabel: item.subject || item.subjectLabel || '',
      gradeNumber: String(item.grade ?? item.gradeNumber ?? '').replace(/\D/g, ''),
      gradeLabel: String(item.grade ?? item.gradeNumber ?? ''),
      lessonUrl: item.lessonUrl || item.packUrl || item.game || item.url || '',
      gameUrl: item.game || item.url || '',
      published: item.published !== false
    };
  }

  function matches(item) {
    const subjectOk = activeSubject === 'all' || item.subjectCode === activeSubject;
    const gradeOk = activeGrade === 'all' || item.gradeNumber === String(activeGrade);
    const term = (search?.value || '').trim().toLowerCase();
    const text = [
      item.title,
      item.subjectLabel,
      item.gradeLabel,
      item.type,
      item.description,
      ...(item.tags || [])
    ].join(' ').toLowerCase();
    return item.published && subjectOk && gradeOk && text.includes(term);
  }

  function render() {
    if (!grid) return;
    const items = catalog.filter(matches);
    grid.innerHTML = '';

    for (const item of items) {
      const article = document.createElement('article');
      article.className = 'card';
      const gradeText = item.gradeNumber ? `${item.gradeNumber}. клас` : '';
      const gameButton = item.gameUrl
        ? `<a class="cta" href="${rootUrl(item.gameUrl)}">▶ Играй</a>`
        : '';
      const lessonButton = item.lessonUrl
        ? `<a class="secondary" href="${rootUrl(item.lessonUrl)}">📦 Отвори комплекта</a>`
        : '';

      article.innerHTML = `
        <div class="banner ${themeClass(item.theme)}"><div class="icon">${escapeHtml(item.icon || '📘')}</div></div>
        <div class="body">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description || '')}</p>
          <div class="tags">
            <span class="tag">${escapeHtml(item.subjectLabel)}</span>
            ${gradeText ? `<span class="tag">${escapeHtml(gradeText)}</span>` : ''}
            ${item.type ? `<span class="tag">${escapeHtml(item.type)}</span>` : ''}
          </div>
          <div class="resource-actions">${gameButton}${lessonButton}</div>
        </div>`;
      grid.appendChild(article);
    }

    empty?.classList.toggle('hidden', items.length > 0);
  }

  async function loadCatalog() {
    try {
      const response = await fetch(rootUrl('data/resources.json'), { cache: 'no-store' });
      if (!response.ok) throw new Error(`resources.json: HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('resources.json трябва да съдържа масив.');
      catalog = data.map(normalise);
      render();
    } catch (error) {
      console.error('EM Learning Studio:', error);
      if (grid) grid.innerHTML = '';
      if (empty) {
        empty.classList.remove('hidden');
        empty.innerHTML = '<h3>Ресурсите не могат да бъдат заредени.</h3><p>Проверете data/resources.json и опитайте отново.</p>';
      }
    }
  }

  document.querySelectorAll('.filter[data-filter]:not(.grade-filter)').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter[data-filter]:not(.grade-filter)').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      activeSubject = button.dataset.filter || 'all';
      render();
    });
  });

  document.querySelectorAll('.grade-filter[data-grade]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.grade-filter[data-grade]').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      activeGrade = button.dataset.grade || 'all';
      render();
    });
  });

  search?.addEventListener('input', render);
  loadCatalog();
})();
