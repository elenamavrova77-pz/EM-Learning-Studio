(function(){
  const escapeHtml = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function themeClass(theme){
    return theme === 'teal' ? 'theme-teal' : theme === 'purple' ? 'theme-purple' : theme === 'orange' ? 'theme-orange' : 'theme-default';
  }

  async function loadFeatured(){
    const grid = document.getElementById('homeFeatured');
    if(!grid) return;
    try{
      const response = await fetch(EMLS.url('data/resources.json'), {cache:'no-store'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const resources = await response.json();
      const featured = resources.filter(item => item.published !== false && item.featured).slice(0,4);
      if(!featured.length){
        grid.innerHTML = '<div class="home-loading">Все още няма публикувани препоръчани ресурси.</div>';
        return;
      }
      grid.innerHTML = featured.map(item => {
        const lessonUrl = item.lessonUrl || `pages/lesson.html?id=${encodeURIComponent(item.id)}`;
        return `
          <article class="resource-card">
            <div class="resource-cover ${themeClass(item.theme)}">
              <span class="resource-icon">${escapeHtml(item.icon || '📚')}</span>
              <span class="resource-code">${escapeHtml(item.id)}</span>
            </div>
            <div class="resource-card-body">
              <div class="resource-meta"><span>${escapeHtml(item.subject)}</span><span>${escapeHtml(item.grade)}. клас</span></div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="resource-badges"><span>${escapeHtml(item.type || 'Учебен ресурс')}</span>${item.duration ? `<span>⏱ ${escapeHtml(item.duration)}</span>` : ''}</div>
              <div class="resource-actions">
                <a class="primary-btn" href="${EMLS.url(lessonUrl)}">📦 Отвори комплекта</a>
                ${item.game ? `<a class="secondary-btn" href="${EMLS.url(item.game)}">▶ Играй</a>` : ''}
              </div>
            </div>
          </article>`;
      }).join('');
    }catch(error){
      console.error('Featured resources could not be loaded:', error);
      grid.innerHTML = '<div class="home-loading">Ресурсите временно не могат да бъдат заредени. Отворете библиотеката от бутона по-горе.</div>';
    }
  }

  function setupMobileMenu(){
    const button = document.querySelector('.mobile-menu-button');
    const menu = document.getElementById('homeNavLinks');
    if(!button || !menu) return;
    button.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '✕' : '☰';
    });
  }

  function setupSearch(){
    const form = document.querySelector('.home-search');
    if(!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = new FormData(form).get('q')?.trim() || '';
      const target = new URL(EMLS.url('pages/library.html'));
      if(query) target.searchParams.set('q', query);
      location.href = target.href;
    });
  }

  setupMobileMenu();
  setupSearch();
  loadFeatured();
})();
