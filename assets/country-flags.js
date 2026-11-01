import { db } from '/firebase-config.js';
import { doc, getDoc, getDocs, collection } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const DEFAULT_SOUTH_ARABIA_FLAG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="200" fill="#ce1126"/><rect y="200" width="900" height="200" fill="#fff"/><rect y="400" width="900" height="200" fill="#000"/><path d="M0 0 L360 300 L0 600 Z" fill="#003f87"/><path d="M125 205 L145 265 L210 265 L158 302 L178 365 L125 327 L72 365 L92 302 L40 265 L105 265 Z" fill="#ce1126"/></svg>');
let cachedSouthArabiaFlag = null;
const ISO_CODES = 'AC AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CP CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DG DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const displayNames = new Intl.DisplayNames(['ar'], {type:'region'});
const DEFAULT_COUNTRIES = [{code:'south-arabia',name:'الجنوب العربي',flag:DEFAULT_SOUTH_ARABIA_FLAG}, ...ISO_CODES.map(code=>({code:code.toLowerCase(),name:displayNames.of(code)||code,flag:'https://flagcdn.com/w40/'+code.toLowerCase()+'.png'})).filter(c=>c.name!==c.code.toUpperCase()).sort((a,b)=>a.name.localeCompare(b.name,'ar'))];
let cachedCountryRegistry = null;
export async function getCountryRegistry(){
 if(cachedCountryRegistry) return cachedCountryRegistry;
 try{
  const [overrides,meta]=await Promise.all([getDocs(collection(db,'country_registry')),getDoc(doc(db,'country_registry_meta','main'))]);
  const byCode=new Map(DEFAULT_COUNTRIES.map(c=>[c.code,c]));
  overrides.forEach(s=>{const d=s.data();if(d&&typeof d.name==='string'&&typeof d.flag==='string')byCode.set(s.id,{code:s.id,name:d.name,flag:d.flag});});
  const disabled=meta.exists()&&Array.isArray(meta.data()?.disabledCodes)?meta.data().disabledCodes:[];
  disabled.forEach(code=>byCode.delete(code));
  const southArabia=byCode.get('south-arabia');
  const rest=[...byCode.values()].filter(c=>c.code!=='south-arabia').sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  cachedCountryRegistry=southArabia?[southArabia,...rest]:rest;
  return cachedCountryRegistry;
 }catch(error){console.warn('Using default country list:',error);cachedCountryRegistry=DEFAULT_COUNTRIES;return cachedCountryRegistry;}
}
export function clearCountryRegistryCache(){cachedCountryRegistry=null;cachedSouthArabiaFlag=null;}

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
