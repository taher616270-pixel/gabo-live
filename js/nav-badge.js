import { auth, db } from '/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

onAuthStateChanged(auth, user=>{
  if(!user) return;
  const uid=user.uid;
  const q=query(collection(db,'privateChats'), where('participants','array-contains', uid));
  onSnapshot(q, snap=>{
    let total=0;
    snap.forEach(d=>{ total += d.data().unread?.[uid] || 0; });
    document.querySelectorAll('#navBadge, .navBadge').forEach(b=>{
      if(total>0){ b.textContent=total>99?'99+':total; b.classList.remove('hide'); }
      else b.classList.add('hide');
    });
  });
});
