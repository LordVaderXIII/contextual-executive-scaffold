# CES deploy

## Test stack vs production

| Aspect | Test compose (`docker-compose.yml`) | Production (BUILD_PLAN) |
|--------|-------------------------------------|-------------------------|
| MariaDB | `db` service (disposable volume) | External MariaDB on LAN |
| Services | `db`, `ces-api`, `ces-web` | `ces-api`, `ces-web` only |
| Data | Seeded fake data on API start | Your real data |
| HA / AI | Mock/degraded without credentials | Configure env on Unraid |

## Quick start (local verification)

From repo root:

```bash
docker compose -f deploy/docker-compose.yml config
docker compose -f deploy/docker-compose.yml build
CES_WEB_PORT=8081 docker compose -f deploy/docker-compose.yml up -d db ces-api ces-web
CES_WEB_PORT=8081 ./scripts/smoke.sh
CES_WEB_PORT=8081 docker compose -f deploy/docker-compose.yml up -d --wait
docker compose -f deploy/docker-compose.yml down -v
```

- API: http://localhost:8000/health  
- Web PWA: http://localhost:8081/ (override with `CES_WEB_PORT`)  

`--wait` is supported on recent Compose when all services define healthchecks.

## Smoke test

Covers health + DB, seeded contexts/tasks, current context, timeline, HA mock zones, nudge evaluate, AI mock decompose, weekly review, frontend HTML and API proxy.

## Tear down

```bash
docker compose -f deploy/docker-compose.yml down -v
```