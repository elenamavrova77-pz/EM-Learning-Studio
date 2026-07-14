
async function loadFeatured(){
  const grid = document.getElementById('homeFeatured');
  if(!grid) return;
  try{
    const response = await fetch('/data/resources.json', {cache:'no-store'});
    const resources = await response.json();
    const featured = resources.filter(x => x.published !== false && x.featured).slice(0,4);
    grid.innerHTML = featured.map(item => `
      <article class="resource-card">
        <div class="resource-cover ${item.theme==='teal'?'theme-teal':item.theme==='purple'?'theme-purple':item.theme==='orange'?'theme-orange':'theme-default'}">
          <span class="resource-icon">${item.icon || '📚'}</span>
          <span class="resource-code">${item.id}</span>
        </div>
        <div class="resource-card-body">
          <div class="resource-meta"><span>${item.subject}</span><span>${item.grade}. клас</span></div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="resource-actions">
            <a class="primary-btn" href="/pages/pack.html?id=${encodeURIComponent(item.id)}">📦 Отвори</a>
            ${item.game ? `<a class="secondary-btn" href="${item.game}">▶ Играй</a>` : ''}
          </div>
        </div>
      </article>`).join('');
  }catch(error){
    console.error(error);
  }
}
loadFeatured();
