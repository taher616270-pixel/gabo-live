# GABO LIVE Infrastructure

The existing website files at the repository root are preserved. The HTML, CSS, JavaScript, images, Firebase configuration, and Firestore rules have not been edited or removed.

A separate Laravel 12 API has been added under `backend/`. MySQL 8.4 and Redis 7 are defined in `infra/docker-compose.yml`. The existing root website remains the Cloudflare Pages frontend; the new API is separate and is not yet connected to the live screens.

Copy `infra/.env.example` to `infra/.env` and replace the sample database passwords before starting Docker Compose. Build and start from the repository root:

```sh
docker compose --env-file infra/.env -f infra/docker-compose.yml build
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
```

The API health endpoint is `/api/v1/health` on port 8000.

This is infrastructure foundation only. Authentication, data migrations, business endpoints, Agora token issuance, background workers, and automated tests are still pending. Firebase remains in place until the API has feature parity and data migration is verified.