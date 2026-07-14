
const catalog = [{"title": "Мисия: Спаси спортната база", "subject": "mathematics", "subjectLabel": "Математика", "grade": "5. клас", "description": "Приключенска игра за мерни единици за лице с нива, отбори и точки.", "icon": "📐", "theme": "default", "url": "/games/mathematics/area.html", "tags": ["мерни единици", "лице", "отборна игра"], "featured": true, "type": "game", "collection": "Спортна математика", "objectives": ["Преобразуване на мерни единици за лице", "Решаване на практически задачи", "Работа в екип"], "materials": [], "gradeNumber": "5", "section": "Мерни единици", "packUrl": "/pages/packs/area.html"}, {"title": "Спортна мисия: Движение", "subject": "mathematics", "subjectLabel": "Математика", "grade": "6. клас", "description": "Задачи от движение в спортен контекст – плуване, колоездене и бягане.", "icon": "🚴", "theme": "teal", "url": "/games/mathematics/movement.html", "tags": ["скорост", "път", "време"], "featured": true, "type": "game", "collection": "Спортна математика", "objectives": ["Прилагане на формулите за път, скорост и време", "Решаване на задачи в спортен контекст"], "materials": [], "gradeNumber": "6", "section": "Задачи от движение", "packUrl": "/pages/packs/movement.html"}, {"title": "Пътят към Пи", "subject": "mathematics", "subjectLabel": "Математика", "grade": "5. клас", "description": "Отборна викторина по спиралата на π с десет станции, таймер и класиране.", "icon": "π", "theme": "purple", "url": "/games/mathematics/pi.html", "tags": ["числото π", "викторина", "отбори"], "featured": true, "type": "game", "collection": "Математически празници", "objectives": ["Разпознаване на основни факти за π", "Работа с математическа информация"], "materials": [], "gradeNumber": "5", "section": "Числото π", "packUrl": "/pages/packs/pi.html"}, {"title": "Познай морфемата", "subject": "interdisciplinary", "subjectLabel": "Интердисциплинарен урок", "grade": "5. клас", "description": "Математика и български език: морфемен анализ чрез геометрични фигури.", "icon": "🔤", "theme": "orange", "url": "/games/interdisciplinary/morphemes.html", "tags": ["математика + БЕЛ", "морфеми", "drag & drop"], "featured": true, "type": "interdisciplinary", "collection": "Математика + БЕЛ", "objectives": ["Свързване на геометрични фигури с морфеми", "Морфемен анализ", "Екипна работа"], "materials": [], "gradeNumber": "5", "section": "Математика + БЕЛ", "packUrl": "/pages/packs/morphemes.html"}];
let active = 'all';
let activeGrade = 'all';

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const buttons = [...document.querySelectorAll('.filter')];
const gradeButtons = [...document.querySelectorAll('.grade-filter')];

function themeClass(theme) {
  return theme === 'teal' ? 'teal'
       : theme === 'purple' ? 'purple'
       : theme === 'orange' ? 'orange'
       : '';
}

function render() {
  if (!grid) return;
  const term = (search?.value || '').trim().toLowerCase();
  const items = catalog.filter(item => {
    const subjectMatches = active === 'all' || item.subject === active;
    const gradeMatches = activeGrade === 'all' || item.gradeNumber === activeGrade;
    const text = [item.title,item.subjectLabel,item.grade,item.section,item.description,...(item.tags||[])].join(' ').toLowerCase();
    return subjectMatches && gradeMatches && text.includes(term);
  });
  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="banner ${themeClass(item.theme)}"><div class="icon">${item.icon}</div></div>
      <div class="body">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="tags">
          <span class="tag">${item.subjectLabel}</span>
          <span class="tag">${item.grade}</span>
          ${item.section ? `<span class="tag">${item.section}</span>` : ''}
        </div>
        <div class="resource-actions">
          <a class="cta" href="${item.url}">▶ Играй</a>
          <a class="secondary" href="${item.packUrl || item.url}">📦 Комплект</a>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  const empty = document.getElementById('empty');
  if (empty) empty.classList.toggle('hidden', items.length > 0);
}

buttons.forEach(button => button.addEventListener('click', () => {
  buttons.forEach(x => x.classList.remove('active'));
  button.classList.add('active');
  active = button.dataset.filter;
  render();
}));

gradeButtons.forEach(button => button.addEventListener('click', () => {
  gradeButtons.forEach(x => x.classList.remove('active'));
  button.classList.add('active');
  activeGrade = button.dataset.grade;
  render();
}));

if (search) search.addEventListener('input', render);
render();
