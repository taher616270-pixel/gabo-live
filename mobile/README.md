# GABO LIVE — Flutter migration

This directory is the new Flutter application. The existing HTML application remains untouched while features are migrated and verified. Do not remove the legacy pages until feature parity and regression checks pass.

## Toolchain

- Flutter 3.38 or newer
- Dart 3.10 or newer
- Firebase project: `gabo-live`
- LiveKit Flutter SDK: `livekit_client 2.13.1`

## Firebase setup

For Android and iOS, run FlutterFire CLI in this directory and generate the platform configuration:

```sh
flutterfire configure --project=gabo-live
```

Then update `app_bootstrap.dart` to use the generated `firebase_options.dart` for native targets before shipping.

For Flutter Web, provide the existing Firebase web app values as compile-time defines:

- `FIREBASE_API_KEY`
- `FIREBASE_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`

These are public Firebase client configuration values, not server credentials. Never put service-account keys, private keys, or LiveKit API secrets in the Flutter client.

## Migration order

1. Flutter shell, theme, localization, and Firebase initialization.
2. Authentication, profile, country registry, and account settings.
3. Home feed, posts, likes, comments, and navigation.
4. Private messaging, public chat, and communities.
5. Room interface and room state (seats, host/moderator permissions, requests, members, VIP frames, gifts, and chat) without live audio.
6. Admin and remaining account features.
7. LiveKit room tokens from a server-side endpoint, then audio publishing/subscribing and device controls.
8. Regression tests and release validation.

The LiveKit dependency is included for the final audio stage, but no LiveKit connection is started in this foundation build.

## Current status

This is the Flutter foundation only. It is not feature-complete and is not a replacement for the production HTML site yet. Existing web pages, Firebase data, and account records are preserved.
