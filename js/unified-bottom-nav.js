const NAV_ITEMS = [
  { id:'home', label:'الرئيسية', path:'/app/', icon:'<path class="nav-outline" d="M5.5 8.2 12 3.8l6.5 4.4v9.1a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2Z"/><path class="nav-detail" d="M9.2 13.8c2.2 1.2 4.2 1.2 5.8-.3l-.3 2.1m.3-2.1-2-.2"/><path class="nav-spark" d="m5.1 2.2.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z"/>' },
  { id:'posts', label:'منشورات', path:'/posts/', icon:'<circle class="nav-outline" cx="12" cy="12" r="7.4"/><path class="nav-outline" d="M5.2 7.8 3.9 5.4m14.9 11.1 1.3 2.2"/><path class="nav-detail" d="M4.4 14.8c2.1-1.5 3.5-1.4 5.4.2 1.8 1.6 3.6 1.6 5.4.1"/><path class="nav-spark" d="m6.4 3.1.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6Z"/>' },
  { id:'games', label:'ألعاب', path:'/games/', icon:'<path class="nav-outline" d="M6.2 6.2h11.6a3.8 3.8 0 0 1 3.7 4.6l-1.2 6.1a2.7 2.7 0 0 1-4.4 1.5L13.7 16h-3.4l-2.2 2.4a2.7 2.7 0 0 1-4.4-1.5l-1.2-6.1a3.8 3.8 0 0 1 3.7-4.6Z"/><path class="nav-detail" d="M7.2 9.5v4.2m-2.1-2.1h4.2m7.1-.8h.1m2.1 2.1h.1"/><path class="nav-spark" d="m5.2 2.2.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7Z"/>' },
  { id:'messages', label:'رسائل', path:'/dm/', icon:'<path class="nav-outline" d="M19.8 11.4a7.6 7.6 0 0 1-7.7 7.5H7l-3.1 2v-5.2a7.5 7.5 0 1 1 15.9-4.3Z"/><path class="nav-detail" d="M10 8.8v5.1m4 0V8.8"/><path class="nav-spark" d="m5 2.6.6 1.3 1.3.6-1.3.6L5 6.4l-.6-1.3-1.3-.6 1.3-.6Z"/>' },
  { id:'profile', label:'ملفي الشخصي', path:'/profile/', icon:'<circle class="nav-outline" cx="12" cy="7.4" r="4.1"/><path class="nav-outline" d="M4.1 20.5c.4-4 3.5-6.3 7.9-6.3s7.5 2.3 7.9 6.3Z"/><path class="nav-spark" d="m6.1 2.2.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7Z"/>' }
];

const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

function routeNow() {
  let path = location.pathname.replace(/index\.html$/, '');
  if (!path || path === '/') return '/app/';
  return path.endsWith('/') ? path : path + '/';
}

function activeItem() {
  const route = routeNow();
  if (route.startsWith('/profile/view/')) return 'profile';
  if (route.startsWith('/community/')) return 'home';
  if (route.startsWith('/app/public/')) return 'profile';
  const found = NAV_ITEMS.filter(item => route === item.path || route.startsWith(item.path))
    .sort((a,b) => b.path.length-a.path.length)[0];
  return found?.id || 'home';
}

function installStyles() {
  if (document.getElementById('gaboUnifiedNavStyles')) return;
  const style = document.createElement('style');
  style.id = 'gaboUnifiedNavStyles';
  style.textContent = `
    body{padding-bottom:calc(78px + env(safe-area-inset-bottom))!important}
    #gaboUnifiedNav{position:fixed!important;inset:auto 0 0!important;z-index:99999!important;width:100%!important;height:calc(66px + env(safe-area-inset-bottom))!important;padding:4px 10px calc(5px + env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:3px!important;align-items:center!important;direction:rtl!important;background:rgba(7,5,14,.985)!important;border-top:1px solid rgba(154,115,220,.08)!important;box-shadow:0 -8px 25px rgba(0,0,0,.24)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}
    #gaboUnifiedNav .gaboNavItem{position:relative!important;min-width:0!important;width:100%!important;height:55px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border:0!important;border-radius:14px!important;background:transparent!important;text-decoration:none!important;color:#393641!important;-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important}
    #gaboUnifiedNav .gaboNavIcon{width:58px!important;height:52px!important;display:grid!important;place-items:center!important;transform:translateZ(0)!important;transition:transform .18s cubic-bezier(.2,.8,.25,1.3),filter .2s ease!important}
    #gaboUnifiedNav .gaboNavIcon svg{width:48px!important;height:48px!important;overflow:visible!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    #gaboUnifiedNav .nav-outline,#gaboUnifiedNav .nav-detail{stroke:currentColor!important;fill:none!important}
    #gaboUnifiedNav .nav-spark{stroke:currentColor!important;fill:currentColor!important;stroke-width:.7!important}
    #gaboUnifiedNav .gaboNavItem.is-active{color:#9d46ff!important}
    #gaboUnifiedNav .gaboNavItem.is-active .gaboNavIcon{filter:drop-shadow(0 0 5px rgba(162,55,255,.38))!important;animation:gaboNavActive .42s cubic-bezier(.2,.8,.25,1.25) both}
    #gaboUnifiedNav .gaboNavItem.is-active .nav-outline{stroke:url(#gaboNavGradient)!important;stroke-dasharray:22 4 8 4!important;animation:gaboStrokeTravel 1.8s linear infinite!important}
    #gaboUnifiedNav .gaboNavItem.is-active .nav-detail{stroke:#c34cff!important}
    #gaboUnifiedNav .gaboNavItem.is-active .nav-spark{fill:#b94cff!important;stroke:#b94cff!important;filter:drop-shadow(0 0 3px #c34cff)!important}
    #gaboUnifiedNav .gaboNavBadge{position:absolute!important;top:1px!important;right:calc(50% - 26px)!important;min-width:17px!important;height:17px!important;padding:0 4px!important;display:none;align-items:center!important;justify-content:center!important;border-radius:20px!important;background:#e64b63!important;color:#fff!important;font:800 9px system-ui!important;border:2px solid #090711!important;z-index:3!important}
    #gaboUnifiedNav .gaboNavItem.is-pressing .gaboNavIcon{transform:scale(.86)!important;filter:drop-shadow(0 0 8px rgba(185,65,255,.65))!important}
    #gaboUnifiedNav .gaboNavItem.is-pressing svg{animation:gaboTap .34s cubic-bezier(.2,.8,.25,1.35)!important}
    @keyframes gaboStrokeTravel{to{stroke-dashoffset:-76}}
    @keyframes gaboNavActive{0%{transform:scale(.82)}65%{transform:scale(1.09)}100%{transform:scale(1)}}
    @keyframes gaboTap{0%{transform:scale(1)}45%{transform:scale(.88)}100%{transform:scale(1.04)}}
    @media(max-width:360px){#gaboUnifiedNav{padding-inline:3px!important;gap:0!important}#gaboUnifiedNav .gaboNavIcon{width:52px!important;height:48px!important}#gaboUnifiedNav .gaboNavIcon svg{width:44px!important;height:44px!important}}
    @media(prefers-reduced-motion:reduce){#gaboUnifiedNav *{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);
}

function addGradient(svg) {
  if (svg.querySelector('#gaboNavGradient')) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = '<linearGradient id="gaboNavGradient" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fa36bf"/><stop offset="48%" stop-color="#a43cff"/><stop offset="100%" stop-color="#258cff"/></linearGradient>';
  svg.prepend(defs);
}

function mount() {
  installStyles();
  const selected = activeItem();
  const existing = document.getElementById('gaboUnifiedNav');
  if (existing) {
    existing.querySelectorAll('.gaboNavItem').forEach(link => {
      const active = link.dataset.navId === selected;
      link.classList.toggle('is-active', active);
      link.classList.remove('is-pressing');
      if (active) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    return;
  }
  document.querySelectorAll('.bottomNav,.bottom-nav').forEach(node => node.remove());
  const nav = document.createElement('nav');
  nav.id = 'gaboUnifiedNav';
  nav.setAttribute('aria-label','التنقل الرئيسي');
  nav.innerHTML = NAV_ITEMS.map(item => {
    const active = item.id === selected;
    return `<a class="gaboNavItem ${active?'is-active':''}" href="${safe(item.path)}" data-nav-id="${item.id}" aria-label="${safe(item.label)}" ${active?'aria-current="page"':''}>
      <span class="gaboNavIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${item.icon}</svg></span>
      ${item.id==='messages'?'<span id="navBadge" class="gaboNavBadge navBadge" style="display:none">0</span>':''}
    </a>`;
  }).join('');
  nav.querySelectorAll('svg').forEach(addGradient);
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[data-nav-id]');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (link.classList.contains('is-active')) return;
    if (window.__gaboNavNavigating) return;
    window.__gaboNavNavigating = true;
    link.classList.add('is-pressing');
    location.assign(link.href);
  });
  document.body.appendChild(nav);
  import('/js/nav-badge.js').catch(() => {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
else mount();
