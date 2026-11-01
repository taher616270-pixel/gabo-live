const CORS = {
  "Access-Control-Allow-Origin": "https://gabo-live.pages.dev",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
};
let cachedAdminToken = null;
let cachedAdminTokenExpiry = 0;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {status,headers:{"Content-Type":"application/json; charset=utf-8",...CORS}});
}
async function fetchWithTimeout(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {...options, signal: controller.signal});
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("UPSTREAM_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
function validOrigin(request) {
  const origin=request.headers.get("Origin")||"";
  return origin==="https://gabo-live.pages.dev"||/^https:\/\/[a-z0-9-]+\.gabo-live\.pages\.dev$/.test(origin);
}
async function sha256(value) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function normalizeEmail(value){return String(value||"").trim().toLowerCase();}
function validEmail(email){return email.length<=254&&/^[a-zA-Z0-9.!#$%&'*+/=?^`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email);}
function randomCode(){
  const max=4294000000,arr=new Uint32Array(1);let n;
  do{crypto.getRandomValues(arr);n=arr[0];}while(n>=max);
  return String(n%1000000).padStart(6,"0");
}
function b64url(bytes){
  let binary="";for(const b of new Uint8Array(bytes))binary+=String.fromCharCode(b);
  return btoa(binary).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function pemToBytes(pem){
  const clean=pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  const binary=atob(clean),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
async function getFirebaseAccessToken(env){
  if(cachedAdminToken&&Date.now()<cachedAdminTokenExpiry-60000)return cachedAdminToken;
  let account;try{account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);}catch{throw new Error("FIREBASE_SERVICE_ACCOUNT_INVALID");}
  if(!account.client_email||!account.private_key||!account.token_uri||!account.project_id)throw new Error("FIREBASE_SERVICE_ACCOUNT_INVALID");
  const now=Math.floor(Date.now()/1000);
  const header=b64url(new TextEncoder().encode(JSON.stringify({alg:"RS256",typ:"JWT"})));
  const claim=b64url(new TextEncoder().encode(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore",aud:account.token_uri,iat:now,exp:now+3600})));
  const unsigned=header+"."+claim;
  const key=await crypto.subtle.importKey("pkcs8",pemToBytes(account.private_key),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
  const assertion=unsigned+"."+b64url(signature);
  const response=await fetchWithTimeout(account.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})},15000);
  const tokenData=await response.json().catch(()=>({}));
  if(!response.ok||!tokenData.access_token)throw new Error("FIREBASE_ADMIN_AUTH_FAILED");
  cachedAdminToken=tokenData.access_token;cachedAdminTokenExpiry=Date.now()+Number(tokenData.expires_in||3600)*1000;
  return cachedAdminToken;
}
async function updateFirebasePassword(env,email,password){
  if(password.length<6||password.length>128)throw new Error("INVALID_PASSWORD");
  const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON),token=await getFirebaseAccessToken(env);
  const base="https://identitytoolkit.googleapis.com/v1/projects/"+encodeURIComponent(account.project_id);
  const lookup=await fetchWithTimeout(base+"/accounts:lookup",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({email:[email]})},15000);
  const lookupData=await lookup.json().catch(()=>({})),localId=lookupData.users?.[0]?.localId;
  if(!lookup.ok||!localId)throw new Error("FIREBASE_USER_NOT_FOUND");
  const update=await fetchWithTimeout(base+"/accounts:update",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({localId,password,returnSecureToken:false})},15000);
  if(!update.ok)throw new Error("FIREBASE_PASSWORD_UPDATE_FAILED");
}
async function sendMail(env,email,code,action,extra={}){
  if(!env.GAS_WEB_APP_URL||!env.GAS_SHARED_SECRET)throw new Error("MAIL_SERVICE_NOT_CONFIGURED");
  const response=await fetchWithTimeout(env.GAS_WEB_APP_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({secret:env.GAS_SHARED_SECRET,email,code:code||"",action,...extra})
  },18000);
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result||result.success!==true)throw new Error(result?.error||"MAIL_SEND_FAILED");
  return result;
}
async function verifyFirebaseIdToken(env,idToken){
  if(!idToken)throw new Error("AUTH_REQUIRED");
  const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token=await getFirebaseAccessToken(env);
  const base="https://identitytoolkit.googleapis.com/v1/projects/"+encodeURIComponent(account.project_id);
  const response=await fetchWithTimeout(base+"/accounts:lookup",{
    method:"POST",
    headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({idToken})
  },15000);
  const data=await response.json().catch(()=>({}));
  const user=data.users?.[0];
  if(!response.ok||!user)throw new Error("AUTH_INVALID");
  return user;
}
async function verifyFirebaseAdmin(env,user){
  if(normalizeEmail(user?.email)===normalizeEmail(env.ADMIN_EMAIL||"taher616380@gmail.com"))return true;
  const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token=await getFirebaseAccessToken(env);
  const path="https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(account.project_id)+"/databases/(default)/documents/users/"+encodeURIComponent(user.localId);
  const response=await fetchWithTimeout(path,{headers:{"Authorization":"Bearer "+token}},12000);
  if(!response.ok)return false;
  const data=await response.json().catch(()=>({}));
  return data.fields?.isAdmin?.booleanValue===true;
}
async function verifyGrant(env,email,purpose,grant){
  if(typeof grant!=="string"||grant.length<40||grant.length>200)return null;
  const identity=await sha256(email+"|"+purpose),key="verified:"+purpose+":"+identity;
  const saved=await env.OTP_KV.get(key);
  if(!saved||await sha256(grant)!==saved)return null;
  await env.OTP_KV.delete(key);return identity;
}
export default {
 async fetch(request,env){
  if(request.method==="OPTIONS"){
   if(!validOrigin(request))return new Response(null,{status:403});
   return new Response(null,{status:204,headers:{...CORS,"Access-Control-Allow-Origin":request.headers.get("Origin")}});
  }
  if(request.method==="GET"&&new URL(request.url).pathname==="/health")return json({ok:true,service:"GABO LIVE OTP",version:"2.0"});
  if(request.method!=="POST")return json({success:false,error:"METHOD_NOT_ALLOWED"},405);
  if(!validOrigin(request))return json({success:false,error:"ORIGIN_NOT_ALLOWED"},403);
  let body;try{body=await request.json();}catch{return json({success:false,error:"INVALID_JSON"},400);}
  const action=String(body.action||""),email=normalizeEmail(body.email);
  if(!env.OTP_KV||!env.GAS_SHARED_SECRET||!env.GAS_WEB_APP_URL)return json({success:false,error:"SERVICE_NOT_CONFIGURED"},503);
  if(!validEmail(email))return json({success:false,error:"INVALID_EMAIL"},400);
  const purpose=action==="send_signup"?"signup":action==="send_reset"?"reset":"";
  if(purpose){
   const identity=await sha256(email+"|"+purpose),cooldownKey="cooldown:"+identity,hourlyKey="hourly:"+identity;
   if(await env.OTP_KV.get(cooldownKey))return json({success:false,error:"RESEND_WAIT",retryAfter:60},429);
   const hourly=Number(await env.OTP_KV.get(hourlyKey)||"0");
   if(hourly>=5)return json({success:false,error:"RATE_LIMITED"},429);
   const code=randomCode(),codeHash=await sha256(email+"|"+purpose+"|"+code+"|"+env.GAS_SHARED_SECRET);
   const record={hash:codeHash,attempts:0,createdAt:Date.now(),expiresAt:Date.now()+300000};
   await env.OTP_KV.put("otp:"+identity,JSON.stringify(record),{expirationTtl:300});
   await env.OTP_KV.put(cooldownKey,"1",{expirationTtl:60});
   await env.OTP_KV.put(hourlyKey,String(hourly+1),{expirationTtl:3600});
   try{await sendMail(env,email,code,purpose==="signup"?"send":"reset");}
   catch(error){console.error("GABO_OTP_MAIL_SEND_FAILED",action,error?.message||"unknown");await env.OTP_KV.delete("otp:"+identity);await env.OTP_KV.delete(cooldownKey);return json({success:false,error:error?.message==="UPSTREAM_TIMEOUT"?"EMAIL_SERVICE_TIMEOUT":"EMAIL_SEND_FAILED"},502);}
   return json({success:true,message:"CODE_SENT",expiresIn:300,resendAfter:60});
  }
  if(action==="verify_signup"||action==="verify_reset"){
   const verifyPurpose=action==="verify_signup"?"signup":"reset",code=String(body.code||"").trim();
   if(!/^\d{6}$/.test(code))return json({success:false,error:"INVALID_CODE_FORMAT"},400);
   const identity=await sha256(email+"|"+verifyPurpose),key="otp:"+identity,raw=await env.OTP_KV.get(key);
   if(!raw)return json({success:false,error:"CODE_EXPIRED_OR_MISSING"},400);
   const record=JSON.parse(raw);
   if(Date.now()>record.expiresAt){await env.OTP_KV.delete(key);return json({success:false,error:"CODE_EXPIRED"},400);}
   const submitted=await sha256(email+"|"+verifyPurpose+"|"+code+"|"+env.GAS_SHARED_SECRET);
   if(submitted!==record.hash){
    record.attempts++;if(record.attempts>=5)await env.OTP_KV.delete(key);
    else await env.OTP_KV.put(key,JSON.stringify(record),{expirationTtl:Math.max(60,Math.ceil((record.expiresAt-Date.now())/1000))});
    return json({success:false,error:record.attempts>=5?"TOO_MANY_ATTEMPTS":"WRONG_CODE",attemptsLeft:Math.max(0,5-record.attempts)},400);
   }
   await env.OTP_KV.delete(key);
   const grant=crypto.randomUUID()+crypto.randomUUID();
   await env.OTP_KV.put("verified:"+verifyPurpose+":"+identity,await sha256(grant),{expirationTtl:300});
   return json({success:true,verified:true,verificationToken:grant,expiresIn:300});
  }
  if(action==="consume_signup"){
   const identity=await verifyGrant(env,email,"signup",body.verificationToken);
   if(!identity)return json({success:false,error:"VERIFICATION_EXPIRED"},400);
   return json({success:true,verified:true});
  }
  if(action==="send_welcome"){
   const authorization=request.headers.get("Authorization")||"";
   const idToken=authorization.startsWith("Bearer ")?authorization.slice(7):String(body.idToken||"");
   const uid=String(body.uid||"").trim();
   if(!idToken||!uid)return json({success:false,error:"AUTH_REQUIRED"},401);
   let user;try{user=await verifyFirebaseIdToken(env,idToken);}catch(error){return json({success:false,error:error?.message==="AUTH_REQUIRED"?"AUTH_REQUIRED":"AUTH_INVALID"},401);}
   if(user.localId!==uid||normalizeEmail(user.email)!==email)return json({success:false,error:"AUTH_INVALID"},401);
   const welcomeKey="welcome:"+uid;
   const welcomeState=await env.OTP_KV.get(welcomeKey);
   if(welcomeState==="sent")return json({success:true,alreadySent:true});
   if(welcomeState==="sending")return json({success:false,error:"WELCOME_IN_PROGRESS"},409);
   await env.OTP_KV.put(welcomeKey,"sending",{expirationTtl:120});
   try{
    await sendMail(env,email,"","welcome");
    await env.OTP_KV.put(welcomeKey,"sent");
    return json({success:true,sent:true});
   }catch(error){
    console.error("GABO_WELCOME_MAIL_FAILED",error?.message||"unknown");
    await env.OTP_KV.delete(welcomeKey);
    return json({success:false,error:error?.message==="UPSTREAM_TIMEOUT"?"EMAIL_SERVICE_TIMEOUT":"WELCOME_EMAIL_FAILED"},502);
   }
  }
  if(action==="admin_email"){
   const idToken=String(body.idToken||"");
   let user;
   try{user=await verifyFirebaseIdToken(env,idToken);}catch{return json({success:false,error:"AUTH_INVALID"},401);}
   let allowedAdmin=false;
   try{allowedAdmin=await verifyFirebaseAdmin(env,user);}catch(error){console.error("GABO_ADMIN_CHECK_FAILED",error?.message||"unknown");}
   if(!allowedAdmin)return json({success:false,error:"ADMIN_ONLY"},403);
   const type=String(body.type||"");
   if(!["contact","host"].includes(type))return json({success:false,error:"INVALID_EMAIL_TYPE"},400);
   const name=String(body.name||"GABO LIVE").slice(0,120);
   const message=String(body.message||"").slice(0,3000);
   const city=String(body.city||"").slice(0,120);
   const details=String(body.details||"").slice(0,2000);
   try{
    await sendMail(env,email,"",type,{name,message,city,details});
    return json({success:true,sent:true});
   }catch(error){
    console.error("GABO_ADMIN_MAIL_FAILED",type,error?.message||"unknown");
    return json({success:false,error:error?.message==="UPSTREAM_TIMEOUT"?"EMAIL_SERVICE_TIMEOUT":"EMAIL_SEND_FAILED"},502);
   }
  }
  if(action==="complete_reset"){
   const password=String(body.password||"");
   if(password.length<6||password.length>128)return json({success:false,error:"INVALID_PASSWORD"},400);
   const identity=await verifyGrant(env,email,"reset",body.verificationToken);
   if(!identity)return json({success:false,error:"VERIFICATION_EXPIRED"},400);
   try{await updateFirebasePassword(env,email,password);}
   catch(error){
    const known=["FIREBASE_USER_NOT_FOUND","INVALID_PASSWORD","FIREBASE_ADMIN_AUTH_FAILED","FIREBASE_PASSWORD_UPDATE_FAILED","FIREBASE_SERVICE_ACCOUNT_INVALID"];
    return json({success:false,error:known.includes(error.message)?error.message:"PASSWORD_UPDATE_FAILED"},502);
   }
   let notificationSent=true;try{await sendMail(env,email,"","password_changed");}catch{notificationSent=false;}
   return json({success:true,passwordUpdated:true,notificationSent});
  }
  return json({success:false,error:"UNKNOWN_ACTION"},400);
 }
};