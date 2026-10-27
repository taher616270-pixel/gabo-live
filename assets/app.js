import { firebaseConfig } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== نظام الصفحات المنعزلة =====
window.showPage = function(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById('page-'+id);
  if(target) target.classList.add('active');
  document.querySelectorAll('.bottom-nav a[data-page]').forEach(a=>a.classList.remove('active'));
  document.querySelector(`.bottom-nav a[data-page="${id}"]`)?.classList.add('active');
  window.scrollTo(0,0);
}

const defaults = {publicChat:true,voiceRooms:true,privateChat:true,launchAlerts:true,hostRegistration:true,vipFounders:true,userProfiles:true,googleLogin:true,giftReactions:true,maintenanceMode:false};
const defaultEmail = {provider:'google_script',urls:{},apiKeys:{},activeUrl:''};
const defaultAgora = {enabled:false,provider:'agora',appId:'',voiceRooms:[{name:'القبو العام',active:true}]};

let flags={...defaults}, remote={buttons:[],theme:{primaryColor:'#7c3aed',background:'#08070d'}}, emailConfig={...defaultEmail}, agoraConfig={...defaultAgora}, currentUser=null, unsubs=[];
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const path=location.pathname.replace(/\/$/,'')||'/';

function toast(msg,kind=''){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.append(el)}el.className='toast '+kind;el.textContent=msg;clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.remove(),3600)}
function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function goto(url){location.href=url}
function userName(){return currentUser?.displayName||currentUser?.email?.split('@')[0]||'مستخدم'}
function getFlag(name){return flags[name]!==false}

function startListeners(){
 unsubs.forEach(fn=>fn()); unsubs=[];
 unsubs.push(onSnapshot(doc(db,'settings','featureFlags'),s=>{if(s.exists())flags={...defaults,...s.data()};applyFlags();},e=>console.warn(e)));
 unsubs.push(onSnapshot(doc(db,'remote_config','main'),s=>{if(s.exists())remote={...remote,...s.data()};applyTheme();},e=>console.warn(e)));
 unsubs.push(onSnapshot(doc(db,'settings','agoraConfig'),s=>{if(s.exists())agoraConfig={...defaultAgora,...s.data()};window.GABO_AGORA_CONFIG=agoraConfig;renderVoiceRooms();},e=>console.warn(e)));
}

function applyFlags(){ $$('[data-flag]').forEach(el=>{const f=el.dataset.flag;el.classList.toggle('hidden',!getFlag(f));}); }
function applyTheme(){const t=remote.theme||{};if(t.primaryColor)document.documentElement.style.setProperty('--purple',t.primaryColor);if(t.background)document.documentElement.style.setProperty('--bg',t.background);}

function bindLogin(){
 $('#googleLogin')?.addEventListener('click', async ()=>{
  try{await signInWithPopup(auth,new GoogleAuthProvider());goto('/app/');}catch(e){toast(e.message,'error')}
 });
 $('#loginForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email=$('#loginEmail')?.value, pass=$('#loginPassword')?.value;
  try{await signInWithEmailAndPassword(auth,email,pass);goto('/app/');}catch(err){toast('خطأ تسجيل الدخول','error')}
 });
 $('#logoutBtn')?.addEventListener('click', async ()=>{await signOut(auth);goto('/');});
}

function renderVoiceRooms(){
 const box=$('#voiceRoomsList'); if(!box) return;
 const rooms=(agoraConfig.voiceRooms||[]).filter(r=>r.active!==false);
 box.innerHTML=rooms.map(r=>`<div class="list-item"><b>${safeText(r.name)}</b><button class="btn primary small">دخول</button></div>`).join('')||'<div class="empty">لا غرف</div>';
}

function bindPublicChat(){
 const box=$('#publicMessages'),form=$('#publicSendForm'); if(!box||!form) return;
 unsubs.push(onSnapshot(query(collection(db,'publicMessages'),orderBy('createdAt','desc'),limit(80)),s=>{
  box.innerHTML=s.docs.reverse().map(d=>{const m=d.data();return `<div class="message ${m.uid===currentUser?.uid?'mine':''}"><b>${safeText(m.name)}</b><div>${safeText(m.text)}</div></div>`}).join('')||'<div class="empty">ابدأ الحديث</div>';
  box.scrollTop=box.scrollHeight;
 }));
 form.addEventListener('submit',async e=>{e.preventDefault();const inp=$('#publicMessageText'),text=inp.value.trim();if(!text||!currentUser) return;await addDoc(collection(db,'publicMessages'),{uid:currentUser.uid,name:userName(),text,createdAt:serverTimestamp()});inp.value='';});
}

function initialize(){
 // تفعيل أزرار الصفحات المنعزلة
 $$('.bottom-nav a[data-page]').forEach(a=>{
  a.addEventListener('click',(e)=>{
   e.preventDefault();
   showPage(a.dataset.page);
  });
 });

 startListeners();
 bindLogin();
 bindPublicChat();
 onAuthStateChanged(auth, async u=>{
  currentUser=u;
  if(u){
   try{await setDoc(doc(db,'profiles',u.uid),{uid:u.uid,email:u.email||'',emailLower:(u.email||'').toLowerCase(),displayName:u.displayName||u.email?.split('@')[0]||'مستخدم',updatedAt:serverTimestamp()},{merge:true})}catch(e){}
   $$('[data-user-name]').forEach(el=>el.textContent=userName());
  } else {
   if(path.startsWith('/app')||path.startsWith('/profile')||path.startsWith('/admin')) goto('/login/');
  }
 });
}

initialize();
