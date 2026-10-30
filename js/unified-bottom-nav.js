import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, doc, getDoc, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const DEFAULT_ITEMS = [
  { icon: '⌂', label: 'الرئيسية', path: '/app/' },
  { icon: '✉', label: 'الرسائل', path: '/dm/' },
  { icon: '◎', label: 'المجتمع', path: '/app/public/' },
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
  if (here.startsWith('/community/')) {
    const communityIndex = items.findIndex(item => normalizePath(item.path) === '/app/public/');
    if (communityIndex >= 0) winner = communityIndex;
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
      ${isMessages ? '<span id="gaboNavUnread" class="gaboNavBadge hide">0</span>' : ''}
    </a>`;
  }).join('');

  document.body.appendChild(nav);
}

async function getItems() {
  try {
    const snapshot = await getDoc(doc(db, 'site_config', 'main'));
    const configured = snapshot.exists() ? snapshot.data().bottomNav : null;
    if (Array.isArray(configured)) {
      const valid = configured
        .filter(item => item && item.visible !== false && item.label && item.path)
        .sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, 5);
      const unique = new Set(valid.map(item => normalizePath(item.path)));
      if (valid.length === 5 && unique.size === 5) return valid;
    }
  } catch (error) {
    console.info('Using default GABO navigation', error?.code || '');
  }
  return DEFAULT_ITEMS;
}

function watchUnread() {
  let stop = null;
  onAuthStateChanged(auth, user => {
    stop?.(); stop = null;
    if (!user) return;
    const unreadQuery = query(
      collection(db, 'privateChats'),
      where('participants', 'array-contains', user.uid)
    );
    stop = onSnapshot(unreadQuery, snapshot => {
      let total = 0;
      snapshot.forEach(chat => { total += Number(chat.data().unread?.[user.uid] || 0); });
      const badge = document.getElementById('gaboNavUnread');
      if (!badge) return;
      badge.textContent = total > 99 ? '99+' : String(total);
      badge.classList.toggle('hide', total < 1);
    }, error => console.warn('Unread count unavailable', error?.code || ''));
  });
}

const start = async () => {
  const items = await getItems();
  render(items);
  watchUnread();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
