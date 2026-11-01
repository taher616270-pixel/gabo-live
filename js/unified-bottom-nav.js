const NAV_ITEMS = [
  { id:'home', label:'الرئيسية', path:'/app/', icon:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
  { id:'posts', label:'اقتراحات', path:'/posts/', icon:'<path d="M3 11v2a2 2 0 0 0 2 2h2l4 5V4l-4 5H5a2 2 0 0 0-2 2Z"/><path d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>' },
  { id:'games', label:'ألعاب', path:'/games/', icon:'<path d="M6 10h12a4 4 0 0 1 3.8 5.2l-.7 2.2a2 2 0 0 1-3.2 1l-2.4-1.9h-3l-2.4 1.9a2 2 0 0 1-3.2-1l-.7-2.2A4 4 0 0 1 6 10Z"/><path d="M8 13v4m-2-2h4m7-1h.01M18 16h.01"/>' },
  { id:'messages', label:'رسائل', path:'/dm/', icon:'<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M7.5 11.5h9M7.5 15h6"/>' },
  { id:'profile', label:'ملفي الشخصي', path:'/profile/', icon:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>' }
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
    body{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}
    #gaboUnifiedNav{position:fixed!important;inset:auto 0 0!important;z-index:99999!important;width:100%!important;height:calc(82px + env(safe-area-inset-bottom))!important;padding:7px 8px calc(8px + env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;align-items:center!important;direction:rtl!important;background:linear-gradient(180deg,rgba(20,17,27,.96),rgba(9,8,14,.99))!important;border-top:1px solid rgba(231,189,99,.22)!important;box-shadow:0 -12px 36px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.035)!important;backdrop-filter:blur(24px) saturate(145%)!important;-webkit-backdrop-filter:blur(24px) saturate(145%)!important}
    #gaboUnifiedNav .gaboNavItem{position:relative!important;isolation:isolate!important;min-width:0!important;width:100%!important;height:64px!important;padding:4px 1px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;border:0!important;border-radius:17px!important;background:transparent!important;text-decoration:none!important;color:#918b9b!important;font-family:'Tajawal',system-ui,sans-serif!important;font-size:10px!important;font-weight:800!important;line-height:1.15!important;white-space:nowrap!important;-webkit-tap-highlight-color:transparent!important;transition:color .22s ease,transform .22s ease!important}
    #gaboUnifiedNav .gaboNavIcon{position:relative!important;width:39px!important;height:36px!important;display:grid!important;place-items:center!important;border-radius:12px!important;color:inherit!important;transform:translateZ(0)!important;transform-style:preserve-3d!important;transition:transform .32s cubic-bezier(.2,.85,.25,1.35),filter .25s ease!important}
    #gaboUnifiedNav .gaboNavIcon:before{content:''!important;position:absolute!important;inset:0!important;z-index:-1!important;border-radius:12px!important;background:linear-gradient(145deg,#ffe9ad 0%,#e7bd63 48%,#a8752e 100%)!important;box-shadow:0 4px 0 #795326,0 8px 16px rgba(214,168,74,.2),inset 0 1px 0 #fff9!important;transform:scaleY(.02)!important;transform-origin:bottom!important;opacity:0!important;transition:transform .34s cubic-bezier(.2,.85,.25,1.35),opacity .2s ease!important}
    #gaboUnifiedNav .gaboNavIcon svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important;position:relative!important;z-index:1!important;transition:transform .28s ease,color .2s ease!important}
    #gaboUnifiedNav .gaboNavLabel{display:block!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;transition:transform .25s ease,color .2s ease!important}
    #gaboUnifiedNav .gaboNavItem.is-active{color:#f6d995!important}
    #gaboUnifiedNav .gaboNavItem.is-active .gaboNavIcon{color:#251b0c!important;transform:translateY(-3px) rotateX(15deg) scale(1.06)!important;filter:drop-shadow(0 4px 5px rgba(214,168,74,.22))!important}
    #gaboUnifiedNav .gaboNavItem.is-active .gaboNavIcon:before{opacity:1!important;transform:scaleY(1)!important}
    #gaboUnifiedNav .gaboNavItem.is-active .gaboNavIcon svg{transform:translateZ(5px)!important}
    #gaboUnifiedNav .gaboNavItem.is-active .gaboNavLabel{transform:translateY(-1px)!important;color:#f6d995!important}
    #gaboUnifiedNav .gaboNavItem.is-pressing .gaboNavIcon{transform:translateY(1px) rotateX(-8deg) scale(.94)!important}
    #gaboUnifiedNav .gaboNavItem.is-pressing .gaboNavIcon:before{opacity:1!important;transform:scaleY(1)!important}
    #gaboUnifiedNav .gaboNavItem.is-pressing .gaboNavIcon svg{color:#251b0c!important;transform:translateZ(7px) scale(1.08)!important}
    #gaboUnifiedNav .gaboNavBadge{position:absolute!important;top:1px!important;right:calc(50% - 25px)!important;min-width:17px!important;height:17px!important;padding:0 4px!important;display:none;align-items:center!important;justify-content:center!important;border-radius:20px!important;background:#e64b63!important;color:#fff!important;font:800 9px system-ui!important;border:2px solid #100d16!important;z-index:3!important}
    @media(max-width:360px){#gaboUnifiedNav{gap:2px!important;padding-inline:4px!important}#gaboUnifiedNav .gaboNavItem{font-size:9px!important}#gaboUnifiedNav .gaboNavIcon{width:35px!important;height:33px!important}}
    @media(prefers-reduced-motion:reduce){#gaboUnifiedNav *{transition:none!important}}
  `;
  document.head.appendChild(style);
}

function mount() {
  document.querySelectorAll('.bottomNav,.bottom-nav').forEach(node => node.remove());
  document.getElementById('gaboUnifiedNav')?.remove();
  installStyles();
  const selected = activeItem();
  const nav = document.createElement('nav');
  nav.id = 'gaboUnifiedNav';
  nav.setAttribute('aria-label','التنقل الرئيسي');
  nav.innerHTML = NAV_ITEMS.map(item => {
    const active = item.id === selected;
    return `<a class="gaboNavItem ${active?'is-active':''}" href="${safe(item.path)}" data-nav-id="${item.id}" ${active?'aria-current="page"':''}>
      <span class="gaboNavIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${item.icon}</svg></span>
      <span class="gaboNavLabel">${safe(item.label)}</span>
      ${item.id==='messages'?'<span id="navBadge" class="gaboNavBadge navBadge" style="display:none">0</span>':''}
    </a>`;
  }).join('');
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[data-nav-id]');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const destination = link.href;
    link.classList.add('is-pressing');
    if (link.classList.contains('is-active')) {
      setTimeout(() => link.classList.remove('is-pressing'), 380);
      return;
    }
    setTimeout(() => { location.href = destination; }, 190);
  });
  document.body.appendChild(nav);
  import('/js/nav-badge.js').catch(() => {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
else mount();
