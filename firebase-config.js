import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDlsjB8eJzVmU0LSnzmJoQY_oJ9QhZIFjA",
  authDomain: "gabo-live.firebaseapp.com",
  projectId: "gabo-live",
  storageBucket: "gabo-live.firebasestorage.app",
  messagingSenderId: "610663904047",
  appId: "1:610663904047:web:db1cc2bc62781e185ae7da",
  measurementId: "G-38RHTREENN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
