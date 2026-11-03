/**
 * GABO LIVE - LiveKit browser client foundation.
 * This module is intentionally isolated from the existing room UI.
 * API keys/secrets must never be placed in this file.
 */
import { auth } from "../firebase-config.js";

const SDK_URL = "https://cdn.jsdelivr.net/npm/livekit-client@2.23.0/dist/livekit-client.umd.min.js";
const TOKEN_ENDPOINT = "/api/livekit/token";

let sdkPromise;
let activeRoom = null;

function loadSdk() {
  if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => window.LivekitClient
        ? resolve(window.LivekitClient)
        : reject(new Error("LIVEKIT_SDK_NOT_AVAILABLE"));
      script.onerror = () => reject(new Error("LIVEKIT_SDK_LOAD_FAILED"));
      document.head.appendChild(script);
    }).catch((error) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

async function fetchRoomCredentials({ roomName, displayName }) {
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");

  const idToken = await user.getIdToken();
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      roomName: String(roomName || "").trim(),
      displayName: String(displayName || user.displayName || "GABO Member").trim()
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.serverUrl || !payload.participantToken) {
    throw new Error(payload.error || "LIVEKIT_TOKEN_REQUEST_FAILED");
  }
  return payload;
}

/**
 * Connects to a LiveKit room without automatically enabling the microphone.
 * The backend token endpoint must verify Firebase ID tokens and authorize
 * the requested room before issuing a short-lived participant token.
 */
export async function connectVoiceRoom(options = {}) {
  if (activeRoom) await disconnectVoiceRoom();

  const roomName = String(options.roomName || "").trim();
  if (!roomName) throw new Error("ROOM_NAME_REQUIRED");

  const [LivekitClient, credentials] = await Promise.all([
    loadSdk(),
    fetchRoomCredentials(options)
  ]);

  const room = new LivekitClient.Room({
    adaptiveStream: true,
    dynacast: true,
    stopLocalTrackOnUnpublish: true
  });

  const events = LivekitClient.RoomEvent;
  const eventNames = [
    "ParticipantConnected",
    "ParticipantDisconnected",
    "TrackSubscribed",
    "TrackUnsubscribed",
    "ActiveSpeakersChanged",
    "ConnectionStateChanged",
    "Disconnected",
    "LocalTrackPublished",
    "LocalTrackUnpublished"
  ];

  for (const name of eventNames) {
    const eventName = events?.[name];
    if (eventName && typeof options.onEvent === "function") {
      room.on(eventName, (...args) => options.onEvent(name, ...args));
    }
  }

  await room.connect(credentials.serverUrl, credentials.participantToken, {
    autoSubscribe: true
  });

  activeRoom = room;
  return room;
}

/** Enable microphone only after the server confirms the member has a speaker seat. */
export async function enableVoiceMicrophone() {
  if (!activeRoom) throw new Error("NOT_CONNECTED_TO_ROOM");
  await activeRoom.localParticipant.setMicrophoneEnabled(true);
  return true;
}

export async function disableVoiceMicrophone() {
  if (!activeRoom) return false;
  await activeRoom.localParticipant.setMicrophoneEnabled(false);
  return true;
}

export async function disconnectVoiceRoom() {
  if (!activeRoom) return;
  const room = activeRoom;
  activeRoom = null;
  await room.disconnect();
}

export function getActiveVoiceRoom() {
  return activeRoom;
}
