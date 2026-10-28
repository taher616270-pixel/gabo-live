// شريط سفلي موحد لكل الموقع
const navHTML = `
<style>
.bottomNav{position:fixed;bottom:0;left:0;right:0;height:84px;background:#0f0e18;border-top:1px solid #2a2840;display:flex;justify-content:space-around;align-items:flex-start;padding-top:8px;padding-bottom:env(safe-area-inset-bottom);direction:ltr;z-index:9999}
.bottomNav a{flex:1;text-decoration:none;color:#6b7280;font-size:10px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative}
.bottomNav a.on{color:#fff}
.bottomNav a .ic{font-size:22px;line-height:1;width:26px;height:26px;display:flex;align-items:center;justify-content:center}
.bottomNav a.plus .ic{background:#7c3aed;color:#fff;width:56px;height:56px;border-radius:16px;font-size:30px;margin-top:-16px;box-shadow:0 4px 12px rgba(124,58,237,.4)}
.navBadge{position:absolute;top:-2px;right:18px;background:#ff3b30;color:#fff;min-width:18px;height:18px;border-radius:9px;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid #0f0e18}
.navBadge.hide{display:none}
</style>
<div class="bottomNav">
  <a href="/profile/" id="nav-profile"><span class="ic">👤</span><span>حسابي</span></a>
  <a href="/dm/" id="nav-dm"><span class="ic">🔒</span><span>دردشة</span><span class="navBadge hide" id="navBadge">0</span></a>
  <a href="/create/" class="plus"><span class="ic">+</span></a>
  <a href="/app/"><span class="ic">📄</span><span>منشور</span></a>
  <a href="/"><span class="ic">🏠</span><span>الرئيسية</span></a>
</div>
`;
document.body.insertAdjacentHTML('beforeend', navHTML);

// تحديد الزر النشط
const path = location.pathname;
if(path.includes('/dm')) document.getElementById('nav-dm')?.classList.add('on');
else if(path.includes('/profile')) document.getElementById('nav-profile')?.classList.add('on');

// عداد الرسائل يشتغل في كل الصفحات
import { db } from '/firebase-config.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const uid = localStorage.getItem('gabo_uid');
if(uid){
  const q = query(collection(db,'chats'), where('users','array-contains', uid));
  onSnapshot(q, snap=>{
    let total=0; snap.forEach(d=>{ total+=d.data().unreadCounts?.[uid]||0; });
    const b=document.getElementById('navBadge');
    if(b){ if(total>0){ b.textContent=total>99?'99+':total; b.classList.remove('hide'); } else b.classList.add('hide'); }
  });
}
