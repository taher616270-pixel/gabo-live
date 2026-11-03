# GABO LIVE — Web-first infrastructure

The existing website at the repository root remains the visual source of truth. Its HTML, CSS, JavaScript, images, routes, Firebase configuration, and Firestore rules have not been changed or deleted. The current Cloudflare Pages workflow continues to deploy the root website.

The new Laravel API is separate and is not connected to live UI actions yet. The Flutter files under frontend/ are an isolated starter prototype and are not the current website deployment.

## Backend components

- backend/: Laravel 12 API runtime.
- backend/routes/api.php: versioned API routes under /api/v1.
- infra/docker-compose.yml: API, MySQL 8.4, and Redis 7.
- infra/.env.example: Docker environment template.
- docs/INFRASTRUCTURE.md: architecture and migration notes.

## Start locally

Install Docker Engine with Docker Compose. From the repository root, copy infra/.env.example to infra/.env, replace the sample database passwords, then run:

```bash
docker compose --env-file infra/.env -f infra/docker-compose.yml build
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
```

The API health endpoint is http://localhost:8000/api/v1/health.

## Implementation status

The Laravel runtime foundation, API health endpoint, Docker image, MySQL connection, Redis cache/queue configuration, and Compose services are scaffolded. Authentication, production database migrations, business APIs, Agora token issuance, gift processing, wallet ledger, VIP/family/agency rules, and the admin panel are not implemented yet.

Do not connect the live website to this API or retire Firebase until each feature is migrated and tested. The next phase is backend authentication and data schema, followed by connecting existing UI behavior through an API adapter without changing its appearance.
