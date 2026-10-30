import { db } from '/firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const DEFAULT_SOUTH_ARABIA_FLAG = '/assets/south-arabia.png.JPG';
let cachedSouthArabiaFlag = null;

export async function getSouthArabiaFlag() {
  if (cachedSouthArabiaFlag) return cachedSouthArabiaFlag;
  try {
    const snapshot = await getDoc(doc(db, 'site_config', 'main'));
    const configured = snapshot.exists()
      ? snapshot.data()?.flags?.southArabiaDataUrl
      : null;
    if (typeof configured === 'string' && /^data:image\/(png|jpeg|webp);base64,/i.test(configured)) {
      cachedSouthArabiaFlag = configured;
      return configured;
    }
  } catch (error) {
    console.warn('Using default South Arabia flag:', error);
  }
  cachedSouthArabiaFlag = DEFAULT_SOUTH_ARABIA_FLAG;
  return cachedSouthArabiaFlag;
}
