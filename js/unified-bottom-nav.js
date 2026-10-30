const DEFAULT_ITEMS = [
  { icon: '⌂', label: 'الرئيسية', path: '/app/' },
  { icon: '▤', label: 'منشورات', path: '/posts/' },
  { icon: '♜', label: 'ألعاب', path: '/games/' },
  { icon: '✉', label: 'رسائل', path: '/dm/' },
  { icon: '♙', label: 'ملفي الشخصي', path: '/profile/' }
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
  if (here.startsWith('/profile/view/')) winner = items.findIndex(item => normalizePath(item.path) === '/profile/');
  if (here.startsWith('/community/')) winner = items.findIndex(item => normalizePath(item.path) === '/app/');
  return winner < 0 ? 0 : winner;
}

function addNavStyles() {
  if (document.getElementById('gaboNavStyles')) return;
  const style = document.createElement('style');
  style.id = 'gaboNavStyles';
  style.textContent = `
    body{padding-bottom:calc(94px + env(safe-area-inset-bottom))!important}
    #gaboUnifiedNav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:99999!important;height:calc(76px + env(safe-area-inset-bottom))!important;padding:7px 7px calc(8px + env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;align-items:center!important;gap:4px!important;direction:rtl!important;background:rgba(12,10,17,.97)!important;border-top:1px solid rgba(231,189,99,.24)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important;box-shadow:0 -12px 35px rgba(0,0,0,.28)!important}
    #gaboUnifiedNav a{position:relative!important;min-width:0!important;width:100%!important;height:60px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;text-decoration:none!important;color:#918a9a!important;font-family:'Tajawal',system-ui,sans-serif!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important;overflow:visible!important;transition:color .22s ease!important;-webkit-tap-highlight-color:transparent!important}
    #gaboUnifiedNav .gaboNavIcon{position:relative!important;width:38px!important;height:34px!important;display:grid!important;place-items:center!important;border-radius:12px!important;font-size:22px!important;line-height:1!important;color:inherit!important;isolation:isolate!important;transform-style:preserve-3d!important;perspective:500px!important;transition:transform .28s cubic-bezier(.2,.9,.25,1.35),filter .25s ease!important}
    #gaboUnifiedNav .gaboNavIcon:before{content:''!important;position:absolute!important;inset:1px!important;border-radius:11px!important;background:linear-gradient(145deg,#f8df9d,#bd8d3e)!important;box-shadow:0 5px 0 #765323,0 9px 18px rgba(214,168,74,.24),inset 0 1px 0 #fff8!important;transform:scaleY(.06) translateY(8px)!important;transform-origin:bottom!important;opacity:0!important;z-index:-1!important;transition:transform .32s cubic-bezier(.2,.9,.25,1.35),opacity .2s ease!important}
    #gaboUnifiedNav .gaboNavLabel{display:block!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.2!important;transition:transform .25s ease,color .2s ease!important}
    #gaboUnifiedNav a.is-active{color:#f7d995!important}
    #gaboUnifiedNav a.is-active .gaboNavIcon{color:#24190b!important;transform:translateY(-4px) rotateX(14deg) scale(1.08)!important;filter:drop-shadow(0 4px 5px rgba(214,168,74,.25))!important}
    #gaboUnifiedNav a.is-active .gaboNavIcon:before{opacity:1!important;transform:scaleY(1) translateY(0)!important}
    #gaboUnifiedNav a.is-active .gaboNavLabel{transform:translateY(-1px)!important;color:#f7d995!important}
    #gaboUnifiedNav a:active .gaboNavIcon{transform:translateY(1px) scale(.91)!important}
    #gaboUnifiedNav a.is-active:after{content:''!important;position:absolute!important;bottom:-2px!important;width:16px!important;height:3px!important;border-radius:9px!important;background:#e7bd63!important;box-shadow:0 0 10px #e7bd6380!important}
    #gaboUnifiedNav .gaboNavBadge{position:absolute!important;top:0!important;right:calc(50% - 25px)!important;min-width:16px!important;height:16px!important;padding:0 4px!important;display:none;align-items:center!important;justify-content:center!important;border-radius:20px!important;background:#e34c65!important;color:#fff!important;font:800 9px system-ui!important;border:1px solid #120f18!important}
    @media(max-width:360px){#gaboUnifiedNav a{font-size:9px!important}#gaboUnifiedNav .gaboNavIcon{width:34px!important;height:32px!important;font-size:20px!important}}
    @media(prefers-reduced-motion:reduce){#gaboUnifiedNav *{transition:none!important}}
  `;
  document.head.appendChild(style);
}

function render(items) {
  document.querySelectorAll('.bottomNav,.bottom-nav').forEach(node => node.remove());
  document.getElementById('gaboUnifiedNav')?.remove();
  addNavStyles();
  const nav = document.createElement('nav');
  nav.id = 'gaboUnifiedNav';
  nav.setAttribute('aria-label', 'التنقل الرئيسي');
  const activeIndex = resolveActive(items);
  nav.innerHTML = items.map((item, index) => {
    const active = index === activeIndex;
    const path = normalizePath(item.path);
    const isMessages = path === '/dm/';
    return `<a href="${escapeHTML(path)}" class="${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''}>
      <span class="gaboNavIcon" aria-hidden="true">${escapeHTML(item.icon || '•')}</span>
      <span class="gaboNavLabel">${escapeHTML(item.label || 'قسم')}</span>
      ${isMessages ? '<span id="navCount" class="gaboNavBadge navBadge" style="display:none">0</span>' : ''}
    </a>`;
  }).join('');
  document.body.appendChild(nav);
}

const start = () => render(DEFAULT_ITEMS);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
