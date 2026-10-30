const DEFAULT_ITEMS = [
  { icon: '⌂', label: 'الرئيسية', path: '/app/' },
  { icon: '✉', label: 'الرسائل', path: '/dm/' },
  { icon: '◎', label: 'المجتمع', path: '/community/' },
  { icon: '♛', label: 'VIP', path: '/vip/' },
  { icon: '◉', label: 'حسابي', path: '/profile/' }
];

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

function normalizePath(path) {
  if (!path || path === '/') return '/app/';
  const value = String(path);
  if (!value.startsWith('/') || value.startsWith('//')) return '/app/';
  return value.endsWith('/') ? value : value + '/';
}

function currentRoute() {
  const path = location.pathname.replace(/index\.html$/, '');
  if (path === '/') return '/app/';
  return path.endsWith('/') ? path : path + '/';
}

function resolveActive(items) {
  const here = currentRoute();
  let winner = -1, longest = -1;
  items.forEach((item, index) => {
    const target = normalizePath(item.path);
    if (here === target || (target !== '/app/' && here.startsWith(target))) {
      if (target.length > longest) { winner = index; longest = target.length; }
    }
  });
  if (here.startsWith('/app/public/') || here.startsWith('/profile/view/')) {
    const profileIndex = items.findIndex(item => normalizePath(item.path) === '/profile/');
    if (profileIndex >= 0) winner = profileIndex;
  }
  if (winner < 0) winner = items.findIndex(item => normalizePath(item.path) === '/app/');
  return winner < 0 ? 0 : winner;
}

function render(items) {
  document.querySelectorAll('.bottomNav,.bottom-nav').forEach(node => node.remove());
  document.getElementById('gaboUnifiedNav')?.remove();

  const nav = document.createElement('nav');
  nav.id = 'gaboUnifiedNav';
  nav.className = 'bottomNav';
  nav.setAttribute('aria-label', 'التنقل الرئيسي');
  const activeIndex = resolveActive(items);

  nav.innerHTML = items.map((item, index) => {
    const active = index === activeIndex;
    const path = normalizePath(item.path);
    const isMessages = path === '/dm/';
    return `<a href="${escapeHTML(path)}" class="${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''}>
      <span class="gaboNavIcon" aria-hidden="true">${escapeHTML(item.icon || '•')}</span>
      <span class="gaboNavLabel">${escapeHTML(item.label || 'قسم')}</span>
      ${isMessages ? '<span id="navCount" class="gaboNavBadge navBadge badgeNav" style="display:none">0</span>' : ''}
    </a>`;
  }).join('');

  document.body.appendChild(nav);
}

const start = () => render(DEFAULT_ITEMS);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
