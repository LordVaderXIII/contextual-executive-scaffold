# CES implementation — remaining after MVP run

## Implemented (MVP vertical slice)

- FastAPI backend with SQLAlchemy models and Alembic migrations `001` + `002`
- API routes: contexts/tasks CRUD, current context, focus sessions, timeline, AI decompose/plan-day (mock without keys), nudge rules/evaluate, HA zones/execute (mock), webhooks, weekly review, export
- SvelteKit PWA shell with design-aligned routes and styling
- Docker compose: disposable MariaDB, `ces-api`, `ces-web` (nginx → API proxy)
- Seed data, smoke script, HA examples YAML, architecture reference

## Not yet implemented (phase gaps)

| Area | Notes |
|------|-------|
| WebSocket `/ws` | Timer tick and live context push |
| Full task CRUD UI | API supports CRUD; frontend is read + decompose |
| Focus session end UI | PATCH API exists; frontend start-only |
| PWA offline queue | Service worker / IndexedDB sync (phase 6) |
| API key auth in UI | Backend enforces when `CES_API_KEY` set |
| OpenAI live calls | Wired; needs `OPENAI_API_KEY` in production |
| Live HA | Needs `HA_URL` + `HA_TOKEN`; local uses mock zones |
| asyncmy driver | Build plan mentions async driver; MVP uses sync pymysql |
| Rate limits on AI | Phase 6 safeguard |
| Vitest/pytest suites | Testing strategy not run in this pass |
| Production compose | No MariaDB in prod compose per BUILD_PLAN — document only |

## Suggested next PRs

1. Focus end + reflection UI wired to PATCH  
2. Task create/edit forms  
3. pytest contract tests with mocked HA/AI  
4. Optional `@vite-pwa/sveltekit` offline shell  
5. Production `deploy/docker-compose.prod.yml` (api + web only, external DB URL)