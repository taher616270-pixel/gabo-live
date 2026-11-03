# GABO LIVE — Web-first rebuild

The rebuild starts with the browser experience. The same Flutter application will later be expanded to Android and iOS; the backend will remain shared across platforms.

## Current structure

- `frontend/`: Flutter application, initially targeting Web.
- `frontend/lib/main.dart`: Arabic, RTL, responsive starter screen.
- `frontend/web/`: Flutter Web document entry point.
- `backend/`: reserved for the Laravel API implementation.
- `infra/`: reserved for Docker and deployment configuration.
- `docs/`: architecture and API documentation.

## Requirements

- Flutter SDK 3.24 or newer (Dart 3.4+).
- A modern browser.
- For later backend work: PHP 8.3+, Composer, MySQL 8+, Redis 7+, and Docker.

## Run the web starter

From the repository root:

```bash
cd frontend
flutter doctor
flutter config --enable-web
flutter pub get
flutter run -d chrome
```

Create a production web build:

```bash
cd frontend
flutter build web --release
```

The generated site is in `frontend/build/web/`. Deploy that directory to Cloudflare Pages.

## Architecture direction

- Frontend: Flutter Web first; Android and iOS follow using the same Flutter codebase.
- API: Laravel REST API.
- Database: MySQL.
- Cache, queues, and realtime coordination: Redis.
- Voice rooms: Agora SDK integration.
- Admin console: browser-based administration connected to the Laravel API.
- Deployment: Docker for backend services; Cloudflare Pages for the compiled web frontend.

## Important status

This is the initial web foundation only. Authentication, live voice, gifts, wallets, VIP, families, agencies, moderation, and admin workflows are not implemented yet. They will be added in separate tested stages. The legacy application remains untouched on the `main` branch.
