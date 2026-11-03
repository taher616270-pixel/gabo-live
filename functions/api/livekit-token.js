const ROOM_ID = "6521974";
const PROJECT_ID = "gabo-live";
// Firebase Web API keys are public client identifiers, not server secrets.
const FIREBASE_API_KEY = "AIzaSyDlsjB8eJzVmU0LSnzmJoQY_oJ9QhZIFjA";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://gabo-live.pages.dev",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin"
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...CORS_HEADERS}});}
function b64url(value){
  const bytes=typeof value==="string"?new TextEncoder().encode(value):new Uint8Array(value);
  let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}
async function signJwt(payload,secret){
  const header=b64url(JSON.stringify({alg:"HS256",typ:"JWT"}));
  const body=b64url(JSON.stringify(payload));
  const data=header+"."+body;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(data));
  return data+"."+b64url(signature);
}
async function verifyFirebaseToken(idToken,apiKey){
  const response=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key="+encodeURIComponent(apiKey),{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken})
  });
  if(!response.ok)throw new Error("Firebase token verification failed");
  const data=await response.json();
  const user=data.users?.[0];
  if(!user?.localId)throw new Error("Unauthenticated");
  return user.localId;
}
async function canPublishAudio(uid,idToken){
  const base="https://firestore.googleapis.com/v1/projects/"+PROJECT_ID+"/databases/(default)/documents/voiceRooms/"+ROOM_ID;
  const headers={Authorization:"Bearer "+idToken};
  const memberResponse=await fetch(base+"/members/"+encodeURIComponent(uid),{headers});
  if(!memberResponse.ok)return false;
  const member=await memberResponse.json();
  const seatValue=member.fields?.seat;
  const seat=seatValue?.integerValue!==undefined?Number(seatValue.integerValue):null;
  if(!Number.isInteger(seat)||seat<1||seat>16)return false;
  const seatResponse=await fetch(base+"/seats/"+seat,{headers});
  if(!seatResponse.ok)return false;
  const seatDoc=await seatResponse.json();
  return seatDoc.fields?.uid?.stringValue===uid;
}
export async function onRequestOptions(){return new Response(null,{status:204,headers:CORS_HEADERS});}
export async function onRequestPost({request,env}){
  try{
    const origin=request.headers.get("Origin")||"";
    if(origin!=="https://gabo-live.pages.dev"&&!/^https:\/\/[a-z0-9-]+\.gabo-live\.pages\.dev$/.test(origin))return json({error:"Origin not allowed"},403);
    if(!env.LIVEKIT_API_KEY||!env.LIVEKIT_API_SECRET||!env.LIVEKIT_URL)return json({error:"LiveKit service is not configured"},503);
    const authorization=request.headers.get("Authorization")||"";
    const idToken=authorization.startsWith("Bearer ")?authorization.slice(7):"";
    if(!idToken)return json({error:"Missing Firebase authentication"},401);
    const uid=await verifyFirebaseToken(idToken,FIREBASE_API_KEY);
    const body=await request.json().catch(()=>({}));
    if(String(body.roomId||ROOM_ID)!==ROOM_ID)return json({error:"Invalid room"},400);
    const canPublish=await canPublishAudio(uid,idToken);
    const now=Math.floor(Date.now()/1000);
    const token=await signJwt({
      iss:env.LIVEKIT_API_KEY,
      sub:uid,
      nbf:now-5,
      exp:now+3600,
      video:{
        roomJoin:true,
        room:ROOM_ID,
        canPublish,
        canSubscribe:true,
        canPublishData:false,
        canPublishSources:canPublish?["microphone"]:[]
      }
    },env.LIVEKIT_API_SECRET);
    return json({token,url:env.LIVEKIT_URL,canPublish});
  }catch(error){
    return json({error:error?.message||"Unable to create LiveKit token"},401);
  }
}
