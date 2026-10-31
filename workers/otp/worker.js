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
  const claim=b64url(new TextEncoder().encode(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/identitytoolkit",aud:account.token_uri,iat:now,exp:now+3600})));
  const unsigned=header+"."+claim;
  const key=await crypto.subtle.importKey("pkcs8",pemToBytes(account.private_key),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
  const assertion=unsigned+"."+b64url(signature);
  const response=await fetch(account.token_uri,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});
  const tokenData=await response.json().catch(()=>({}));
  if(!response.ok||!tokenData.access_token)throw new Error("FIREBASE_ADMIN_AUTH_FAILED");
  cachedAdminToken=tokenData.access_token;cachedAdminTokenExpiry=Date.now()+Number(tokenData.expires_in||3600)*1000;
  return cachedAdminToken;
}
async function updateFirebasePassword(env,email,password){
  if(password.length<6||password.length>128)throw new Error("INVALID_PASSWORD");
  const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON),token=await getFirebaseAccessToken(env);
  const base="https://identitytoolkit.googleapis.com/v1/projects/"+encodeURIComponent(account.project_id);
  const lookup=await fetch(base+"/accounts:lookup",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({email:[email]})});
  const lookupData=await lookup.json().catch(()=>({})),localId=lookupData.users?.[0]?.localId;
  if(!lookup.ok||!localId)throw new Error("FIREBASE_USER_NOT_FOUND");
  const update=await fetch(base+"/accounts:update",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({localId,password,returnSecureToken:false})});
  if(!update.ok)throw new Error("FIREBASE_PASSWORD_UPDATE_FAILED");
}
async function sendMail(env,email,code,action){
  const response=await fetch(env.GAS_WEB_APP_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:env.GAS_SHARED_SECRET,email,code:code||"",action})});
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result||result.success!==true)throw new Error("MAIL_SEND_FAILED");
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
   catch{await env.OTP_KV.delete("otp:"+identity);return json({success:false,error:"EMAIL_SEND_FAILED"},502);}
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
   let account;try{account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);}catch{return json({success:false,error:"FIREBASE_SERVICE_ACCOUNT_INVALID"},500);}
   const token=await getFirebaseAccessToken(env);
   const base="https://identitytoolkit.googleapis.com/v1/projects/"+encodeURIComponent(account.project_id);
   const lookup=await fetch(base+"/accounts:lookup",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({idToken})});
   const lookupData=await lookup.json().catch(()=>({}));
   const user=lookupData.users?.[0];
   if(!lookup.ok||!user||user.localId!==uid||normalizeEmail(user.email)!==email)return json({success:false,error:"AUTH_INVALID"},401);
   const welcomeKey="welcome:"+uid;
   if(await env.OTP_KV.get(welcomeKey))return json({success:true,alreadySent:true});
   await env.OTP_KV.put(welcomeKey,"sending",{expirationTtl:86400});
   try{
    await sendMail(env,email,"","welcome");
    await env.OTP_KV.put(welcomeKey,"sent",{expirationTtl:31536000});
    return json({success:true,sent:true});
   }catch{
    await env.OTP_KV.delete(welcomeKey);
    return json({success:false,error:"WELCOME_EMAIL_FAILED"},502);
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