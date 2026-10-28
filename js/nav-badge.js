import { db } from '/firebase-config.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function initBadge(){
  const uid = localStorage.getItem('gabo_uid');
  if(!uid) return;
  const q = query(collection(db,'chats'), where('users','array-contains', uid));
  onSnapshot(q, snap=>{
    let total=0;
    snap.forEach(d=>{
      total += d.data().unreadCounts?.[uid] || 0;
    });
    document.querySelectorAll('#navBadge, .navBadge').forEach(b=>{
      if(total>0){
        b.textContent = total>99?'99+':total;
        b.classList.remove('hide');
      } else {
        b.classList.add('hide');
      }
    });
  });
}
initBadge();
