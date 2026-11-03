# GABO LIVE integration plan — audio last

This branch completes and validates the existing non-audio product before the LiveKit rollout.

## Non-audio scope
- [x] Replace the posts placeholder with a Firebase-backed feed: publish text or media URL, live feed, likes, comments, and author deletion.
- [x] Align the Firestore post create allowlist with the author display fields used by the feed.
- [ ] Verify login/signup, Google, OTP email verification, welcome email, and password reset against the deployed Worker configuration.
- [ ] Verify profile editing, avatar/cover persistence, country flags, follow/unfollow, and public profile navigation.
- [ ] Verify official/custom communities, create/join/leave, owner moderation, community messages, and global chat.
- [ ] Verify private conversations, message history, unread badges, and participant authorization.
- [ ] Verify VIP levels, popup, frames, entitlement rules, and admin grant/revoke flows.
- [ ] Verify host applications, announcements, feedback, subscription requests, and admin management.
- [ ] Verify notification preferences, inbox, and browser push behavior on supported devices.
- [ ] Verify bottom navigation and every route on iOS Safari, Android Chrome, and desktop web.
- [ ] Audit Firestore rules against actual client reads/writes; fix permission errors without broad public writes.
- [ ] Add repeatable smoke tests and verify the production deployment.

## Explicitly deferred until the final phase
- [ ] LiveKit project/server setup and secret configuration.
- [ ] Authenticated LiveKit token endpoint.
- [ ] Audio room connection, microphone publishing, seat management, moderation, and VIP seat frames.
- [ ] Audio performance and device testing.

## Constraints
- Keep the repository `taher616270-pixel/gabo-live`.
- Preserve Firebase Authentication and Firestore as identity and application-data layers.
- Preserve the existing Arabic UI and approved black/gold/purple GABO LIVE visual direction.
- Keep changes on this feature branch until reviewed and verified; do not change production prematurely.
- Do not connect or enable audio before all non-audio items are verified.
