# GABO LIVE - LiveKit voice foundation

This directory is an isolated first-stage integration foundation. It does not replace or modify the existing room screen.

## Architecture

- Existing Firebase Authentication remains the identity provider.
- Existing Firestore remains the source of truth for profiles, VIP, room ownership, seat state, and moderation.
- LiveKit handles real-time audio transport and participant connectivity.
- The browser client is in `livekit-client.js`.
- The client requests short-lived participant credentials from `POST /api/livekit/token`.
- Microphone publishing is disabled after joining. The room UI should enable it only after the backend-authorized seat assignment succeeds.

## Required backend endpoint

Implement `POST /api/livekit/token` on a trusted server (Cloudflare Worker or another server-side runtime).

Request:
```json
{
  "roomName": "gabo-room-id",
  "displayName": "Member display name"
}
```

Authentication:
- Require `Authorization: Bearer <Firebase ID token>`.
- Verify the Firebase ID token signature, issuer, audience, expiry, and subject server-side.
- Resolve the user's actual UID and role from trusted Firestore records.
- Never trust a UID, role, VIP level, seat number, or permission supplied by the browser.
- Verify that the room exists and the user is allowed to join it.
- Set `canPublish` only for users who currently hold an authorized speaker seat.
- Issue short-lived LiveKit participant tokens scoped to one room and one participant identity.
- Return `{ "serverUrl": "wss://...", "participantToken": "..." }`.

Secrets required only on the server:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Never add LiveKit API credentials to HTML, JavaScript, Firebase client config, or Git history.

## Room behavior to implement in the next stage

1. One room maps to one LiveKit room.
2. The Firestore seat document is authoritative for seat ownership.
3. A member can occupy at most one microphone seat in a room.
4. Seat changes must be atomic in Firestore; release the old seat before assigning the new seat.
5. The backend must revoke or update publish permission when a speaker is muted, removed, or loses their seat.
6. VIP frames are presentation-only and continue to come from the existing GABO VIP data.
7. Listeners join with microphone publishing disabled.
8. Disconnect and page lifecycle cleanup must release local tracks and the seat reservation.

## Current status

- [x] Create an isolated browser client foundation.
- [x] Keep Firebase as the identity/data layer.
- [x] Load the LiveKit browser SDK v2.23.0.
- [x] Request credentials from a server endpoint (endpoint still needs to be implemented).
- [x] Join without automatically turning on the microphone.
- [ ] Configure a LiveKit Cloud project or self-hosted LiveKit server.
- [ ] Add secure Firebase-authenticated token endpoint and server-side role/seat authorization.
- [ ] Integrate with the existing room UI and Firestore seat transactions.
- [ ] Test iOS Safari, Android Chrome, and desktop browsers.

## Official references

- LiveKit JavaScript client SDK: https://docs.livekit.io/reference/client-sdk-js/
- LiveKit server SDK and token generation: https://docs.livekit.io/reference/server-sdk-js/
- LiveKit GitHub: https://github.com/livekit/client-sdk-js
