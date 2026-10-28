// GABO LIVE - المحرك المشترك لكل الصفحات (حراسة الدخول، التنقل، الشات)
import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc, collection, addDoc, query, where, orderBy, limitToLast, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export { auth, db };

/* ---------- أعلام الدول - تم إضافة علم الجنوب العربي ---------- */
export const COUNTRY_FLAGS = {
  'sa': 'https://flagcdn.com/w320/sa.png',
  'ye': 'https://flagcdn.com/w320/ye.png',
  'ae': 'https://flagcdn.com/w320/ae.png',
  'om': 'https://flagcdn.com/w320/om.png',
  'south-arabia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_South_Arabia.svg/320px-Flag_of_South_Arabia.svg.png',
  'south-yemen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_South_Arabia.svg/320px-Flag_of_South_Arabia.svg.png'
};

export function getCountryFlag(code) {
  if (!code) return '';
  const c = String(code).toLowerCase();
  return COUNTRY_FLAGS[c] || '';
}

/* ---------- المسارات: كل صفحة تعرف الباقي بالاسم ---------- */
export const ROUTES = {
  home: '/', login: '/login/', app: '/app/', public: '/app/public/',
  private: '/app/private/', profile: '/profile/', hosts: '/hosts/', vip: '/vip/', admin: '/admin/'
};
export function go(target, replace) {
  const url = ROUTES[target] || target;
  replace ? location.replace(url) : location.assign(url);
}
// الصفحة اللي كان رايحها المستخدم قبل ما نحوله للدخول
export function safeNext() {
  const n = new URLSearchParams(location.search).get('next');
  return n && /^\/(?!\/)/.test(n) ? n : ROUTES.app;
}

/* ---------- ادوات ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function toast(msg, kind = '') {
  $('#toast')?.remove();
  const el = Object.assign(document.createElement('div'), { id: 'toast', className: 'toast ' + kind, textContent: msg });
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}
export function showPage(id) {
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + id));
  $$('[data-show]').forEach(b => b.classList.toggle('on', b.dataset.show === id));
  scrollTo(0, 0);
}

/* ---------- المستخدم والصلاحيات ---------- */
export let me = null;
export let myProfile = {};
const never = new Promise(() => {});

export function currentUser() {
  return new Promise(res => { const off = onAuthStateChanged(auth, u => { off(); res(u); }); });
}
export async function getProfile(uid) {
  const s = await getDoc(doc(db, 'users', uid));
  return s.exists() ? s.data() : {};
}
export const userName = () => myProfile.name || me?.displayName || me?.email?.split('@')[0] || 'مستخدم';

export async function requireAuth() {
  const u = await currentUser();
  if (!u) { go(ROUTES.login + '?next=' + encodeURIComponent(location.pathname + location.search), true); await never; }
  me = u;
  myProfile = await getProfile(u.uid).catch(() => ({}));
  if (myProfile.banned) { await signOut(auth); go(ROUTES.login + '?banned=1', true); await never; }
  return u;
}
export async function requireAdmin() {
  const u = await requireAuth();
  if (myProfile.isAdmin !== true) { go('app', true); await never; }
  return u;
}
export async function logout() { await signOut(auth); go('login', true); }

/* ---------- شريط التنقل السفلي (تتحكم فيه لوحة الادمن من site_config) ---------- */
const DEFAULT_NAV = [
  { icon: '⌂', label: 'الرئيسية', path: '/app/' },
  { icon: '🌍', label: 'العام', path: '/app/public/' },
  { icon: '✉', label: 'الخاص', path: '/app/private/' },
  { icon: '♛', label: 'VIP', path: '/vip/' },
  { icon: '◉', label: 'حسابي', path: '/profile/' }
];
const fixPath = p => (p === '/' ? '/app/' : p);

function drawNav(items) {
  let nav = $('#bottomNav');
  if (!nav) { nav = Object.assign(document.createElement('nav'), { id: 'bottomNav', className: 'bottom-nav' }); document.body.append(nav); }
  const here = location.pathname.replace(/index\.html$/, '').replace(/([^/])$/, '$1/');
  let best = -1, len = 0;
  items.forEach((n, i) => { const p = fixPath(n.path); if (here.startsWith(p) && p.length > len) { best = i; len = p.length; } });
  nav.innerHTML = items.map((n, i) =>
    `<a href="${esc(fixPath(n.path))}" class="${i === best ? 'active' : ''}"><b>${esc(n.icon)}</b><span>${esc(n.label)}</span></a>`).join('');
}
async function mountNav() {
  drawNav(DEFAULT_NAV);
  try {
    await currentUser();
    const s = await getDoc(doc(db, 'site_config', 'main'));
    const nav = s.exists() && s.data().bottomNav;
    if (Array.isArray(nav) && nav.length) drawNav(nav.filter(n => n.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  } catch (e) { /* نبقى على الافتراضي */ }
}

/* ---------- تشغيل الصفحة: boot({auth:true}) او boot({admin:true}) او boot() للصفحات المفتوحة ---------- */
export async function boot(opt = {}) {
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); return go(g.dataset.go); }
    const s = e.target.closest('[data-show]');
    if (s) { e.preventDefault(); return showPage(s.dataset.show); }
    if (e.target.closest('[data-logout]')) { e.preventDefault(); logout(); }
  });
  mountNav();
  let u;
  if (opt.admin) u = await requireAdmin();
  else if (opt.auth) u = await requireAuth();
  else { u = await currentUser(); if (u) { me = u; myProfile = await getProfile(u.uid).catch(() => ({})); } }
  $$('[data-user-name]').forEach(el => (el.textContent = userName()));
  $$('[data-admin-only]').forEach(el => el.classList.toggle('hidden', myProfile.isAdmin !== true));
  return u;
}

/* ---------- شات مجتمع (يستخدم في /app/ و /app/public/) ---------- */
export function mountChat({ box, input, button, community = 'general' }) {
  let cid = community, unsub = null;
  function listen() {
    unsub?.();
    const q = query(collection(db, 'messages'), where('communityId', '==', cid), orderBy('createdAt', 'asc'), limitToLast(100));
    unsub = onSnapshot(q, snap => {
      box.replaceChildren();
      if (snap.empty) { box.append(Object.assign(document.createElement('div'), { className: 'empty', textContent: 'ابدأ الحديث 👋' })); return; }
      snap.forEach(d => {
        const m = d.data();
        const row = Object.assign(document.createElement('div'), { className: 'msg' + (m.from === me?.uid ? ' me' : '') });
        row.append(Object.assign(document.createElement('b'), { textContent: m.fromName || m.name || '' }),
                   Object.assign(document.createElement('div'), { textContent: m.text }));
        box.append(row);
      });
      box.scrollTop = box.scrollHeight;
    }, e => toast('تعذر تحميل الرسائل', 'error'));
  }
  async function send() {
    const text = input.value.trim().slice(0, 500);
    if (!text || !me) return;
    input.value = '';
    try {
      await addDoc(collection(db, 'messages'), { communityId: cid, from: me.uid, fromName: userName(), name: userName(), text, createdAt: serverTimestamp() });
    } catch (e) { toast('تعذر الارسال', 'error'); input.value = text; }
  }
  button.onclick = send;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  listen();
  return { setCommunity(id) { cid = id; listen(); }, stop() { unsub?.(); } };
}
