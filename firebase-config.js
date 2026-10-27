import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDlsjB8eJzVmU0LSnzmJoQY_oJ9QhZIFjA",
  authDomain: "gabo-live.firebaseapp.com",
  projectId: "gabo-live",
  storageBucket: "gabo-live.firebasestorage.app",
  messagingSenderId: "610663904047",
  appId: "1:610663904047:web:db1cc2bc62781e185ae7da",
  measurementId: "G-38RHTREENN"
};

// منع إعادة التهيئة - يحل مشكلة الصفحات المنعزلة
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 1. ثبات الجلسة بين الصفحات المنعزلة
setPersistence(auth, browserLocalPersistence).catch(console.warn);

// 2. تخزين مؤقت للفايرستور - يسرع التنقل بين الصفحات
enableIndexedDbPersistence(db).catch(e=>{
  if(e.code !== 'failed-precondition') console.warn('persistence:',e.code);
});

// 3. Analytics فقط إذا مدعوم
export let analytics = null;
isSupported().then(s=>{ if(s) analytics = getAnalytics(app); });
