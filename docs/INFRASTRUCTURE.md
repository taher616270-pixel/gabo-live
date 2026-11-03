# GABO LIVE Infrastructure

The existing website files at the repository root are preserved. The HTML, CSS, JavaScript, images, Firebase configuration, and Firestore rules have not been edited or removed.

A separate Laravel 12 API has been added under backend/. MySQL 8.4 and Redis 7 are defined in infra/docker-compose.yml. The existing root website remains the Cloudflare Pages frontend; the new API is separate and is not yet connected to the live screens.

## Current backend foundation

- Laravel API routes under /api/v1.
- MySQL connection using utf8mb4.
- Redis connection for cache and queues.
- Initial database migrations for accounts, profiles, sessions, password reset tokens, wallets, wallet ledger entries, and admin audit logs.
- Docker Compose services for the API, MySQL, and Redis.
- A backend CI workflow for Composer manifest and PHP syntax validation.

## Start locally

Copy infra/.env.example to infra/.env and replace the sample database passwords before starting Docker Compose. From the repository root:

```sh
docker compose --env-file infra/.env -f infra/docker-compose.yml build
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
docker compose --env-file infra/.env -f infra/docker-compose.yml exec api php artisan migrate
```

The API health endpoint is /api/v1/health on port 8000.

## Important

This is the foundation, not a completed production backend. Authentication, full domain schemas for rooms, gifts, levels, VIP, families and agencies, Agora token issuance, admin authorization, background workers, backups, and monitoring still require implementation and tests. The API is not connected to the live website yet. Firebase remains in place until feature parity and data migration are verified.
