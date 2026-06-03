# CES Build Plan

**Contextual Executive Scaffold** — implementation roadmap for self-hosted deployment on Unraid.

| Field | Value |
|-------|-------|
| Status | MVP vertical slice implemented (see docs/REMAINING.md) |
| Last updated | June 2026 |
| Stack | FastAPI, SvelteKit PWA, external MariaDB, Home Assistant, OpenAI-compatible AI |

## Changelog

| Date | Change |
|------|--------|
| 2026-06 | Initial build plan created from App Design Document v1.0 (May 2026) |
| 2026-06 | MVP: backend API, migrations, SvelteKit PWA, local Docker + smoke |

---

## Architecture references

| Document | Role |
|----------|------|
| [docs/architecture/REFERENCE.md](docs/architecture/REFERENCE.md) | Canonical app design / architecture (import from Claude) |
| [README.md](README.md) | Project overview, philosophy, and HA example snippet |
| This file | Implementation roadmap and technical build plan |

If the reference design and this plan diverge, update one or both and note the change in the changelog above.

---

## 1. Purpose and goals

CES is a self-hosted ADHD executive function support tool that externalises structure where internal regulation is weakest: initiation and completion of non-preferred tasks, home attentiveness, hyperfocus containment, and location-based priority shifts.

**Core objectives (healthy and sustainable)**

- Provide external structure where internal regulation is weakest.
- Support context-appropriate behaviour (work/study at work; home routines and wind-down at home).
- Use gentle, user-controlled persistence for accountability — not punitive nagging.
- Enable self-insight through simple logging and reflection.
- Remain maintainable on existing Unraid infrastructure with full data ownership.

**Hosting constraints**

- Docker on Unraid server.
- **External MariaDB** (not bundled in the CES compose stack).
- Home Assistant for contextual nudges, zones, and automations.
- AI strictly on-demand (no background polling).

---

## 2. Architecture overview

```mermaid
flowchart TB
  subgraph unraid [Unraid Docker]
    FE[SvelteKit PWA]
    API[FastAPI]
    FE -->|REST and optional WS| API
  end
  subgraph external [Existing services]
    DB[(MariaDB external)]
    HA[Home Assistant]
  end
  API --> DB
  API -->|REST read zones execute services| HA
  HA -->|webhooks POST| API
  Phone[iPhone PWA] --> FE
  Win[Windows browser] --> FE
```

### Stack decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Database | External MariaDB | Relational integrity, concurrency on logs, Unraid backups |
| Backend | FastAPI + SQLAlchemy 2 + Alembic | Async, OpenAPI, typed models, migrations |
| DB driver | `asyncmy` or `aiomysql` | Async MariaDB from FastAPI |
| Frontend | SvelteKit + `@vite-pwa/sveltekit` | Installable PWA, offline-capable core views, smaller bundle |
| Auth (MVP) | API key or session cookie | Single-user self-hosted |
| AI | OpenAI-compatible HTTP API | On-demand; configurable `OPENAI_BASE_URL` for proxies or cloud |
| HA | REST + optional WebSocket | Zone/person state; outbound lights/scenes/notify; inbound webhooks |

### Target repository layout (at implementation time)

```
contextual-executive-scaffold/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   └── services/
│   ├── alembic/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/routes/
│   ├── src/lib/api/
│   └── Dockerfile
├── deploy/
│   ├── docker-compose.yml
│   ├── .env.example
│   └── unraid-template-notes.md
├── docs/
│   ├── architecture/
│   └── ha-examples.yaml
└── BUILD_PLAN.md
```

---

## 3. Core features (product map)

| Feature | Summary | Phase |
|---------|---------|-------|
| Location-aware context switching | HA zones → default task lists and views | 5 |
| AI task decomposition + implementation intentions | On-demand micro-steps and if-then plans | 3 |
| Visual timeline + timers | Day/week view, countdown, end-of-block prompts | 2 |
| Hyperfocus containment | Contained sessions with explicit end conditions | 5 |
| Gentle persistence / nudges | User rules → HA cues + in-app banner actions | 4 |
| Logging and reflection | Quick notes; optional AI pattern summary later | 2, 6 |

Scientific grounding is documented in the app design reference ([docs/architecture/REFERENCE.md](docs/architecture/REFERENCE.md)) and summarized in [Appendix: Evidence](#appendix-evidence).

---

## 4. Data model (MariaDB)

Database name: `ces`. Charset: `utf8mb4` / `utf8mb4_unicode_ci`.

### Tables

| Table | Key columns | Notes |
|-------|-------------|-------|
| `contexts` | `id`, `name`, `slug`, `location_rules` JSON, `default_priorities` JSON, `is_active` | `location_rules`: HA zone entity IDs, optional time windows |
| `tasks` | `id`, `description`, `context_id` FK, `is_preferred`, `status`, `due_at`, `ai_decomposition` JSON, `implementation_intention`, `sort_order` | Status: `pending`, `in_progress`, `done`, `snoozed`, `dismissed` |
| `focus_sessions` | `id`, `task_id` FK nullable, `started_at`, `ended_at`, `session_type`, `end_condition`, `notes` | `session_type`: `normal` or `hyperfocus` |
| `nudge_rules` | `id`, `context_id`, `cron_or_ha_trigger`, `conditions` JSON, `intensity`, `enabled` | User-defined gentle persistence |
| `nudges` | `id`, `rule_id`, `context_id`, `fired_at`, `nudge_type`, `user_response`, `metadata` JSON | Outcome logging for weekly review |
| `ai_interactions` | `id`, `prompt_type`, `input_hash`, `input_summary`, `output_summary`, `full_response` JSON, `created_at` | Cache key = hash(normalised input + `prompt_type`) |
| `reflection_logs` | `id`, `session_id` FK nullable, `logged_at`, `worked`, `blocked`, `note` | End-of-block or end-of-day |
| `app_settings` | `key`, `value` JSON | Pause mode, context override, HA entity map |

Design doc tables (`Contexts`, `Tasks`, `Focus_Sessions`, `Nudges`, `AI_Interactions`) are extended with `nudge_rules`, `reflection_logs`, and `app_settings` for MVP behaviour.

---

## 5. API surface (by phase)

Base path: `/api/v1`. All mutating routes require API key (MVP).

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| CRUD | `/contexts`, `/tasks` | Context and task management | 1 |
| GET | `/contexts/current` | Resolved context from HA + override | 1 |
| POST | `/focus-sessions` | Start timer session | 2 |
| PATCH | `/focus-sessions/{id}` | End session + reflection | 2 |
| GET | `/timeline` | Tasks + sessions for date range | 2 |
| POST | `/ai/decompose` | On-demand breakdown (cache first) | 3 |
| POST | `/ai/plan-day` | Optional morning plan | 3 |
| CRUD | `/nudge-rules` | User nudge rules | 4 |
| POST | `/nudges/evaluate` | Evaluate rules; return HA + app actions | 4 |
| POST | `/webhooks/ha` | HA automation callbacks | 4 |
| GET | `/ha/zones` | Person/tracker zone state | 1 |
| POST | `/ha/execute` | Call HA services | 4 |
| GET | `/review/weekly` | Nudge outcomes + reflections | 6 |
| GET | `/export` | JSON backup export | 6 |
| GET | `/health` | Health check | 1 |
| WS | `/ws` | Timer tick, context change (optional) | 2+ |

### Context resolution

1. Read HA `person.*` or `device_tracker.*` from configured entities.
2. Match `contexts.location_rules` (zone name → context).
3. Fall back to manual override in `app_settings` or last-known context.
4. Expose `current_context` to frontend for filters and default views.

### Nudge engine (phase 4)

- Evaluate rules when HA webhook fires or scheduled job runs.
- Return `{ "ha_actions": [...], "app_banner": {...} }`.
- Log every fire to `nudges` with user response.
- Never auto-escalate; respect pause mode and dismiss-for-today.

### AI decompose (phase 3)

- Structured JSON: `{ "micro_steps": [...], "implementation_intention": "..." }`.
- Validate with Pydantic; store in `ai_interactions`.
- Reuse cached response when `input_hash` matches.
- Allow manual paste (external Claude session) without API call.

---

## 6. Frontend routes (SvelteKit PWA)

| Route | Features |
|-------|----------|
| `/` | Dashboard: context badge, filtered tasks, quick add |
| `/tasks` | CRUD, preferred flag, “Break this down” |
| `/timeline` | Day/week visual timeline; tasks + sessions |
| `/focus` | One-tap timer; hyperfocus with end condition |
| `/nudges` | Rule editor, intensity, exemptions, pause mode |
| `/review` | Weekly nudge outcomes + reflections |
| `/settings` | HA entity IDs, API status, export |

**Offline (phase 6):** service worker caches shell + last tasks/contexts; queue writes in IndexedDB; sync when online.

**iOS:** `manifest.webmanifest`, icons, HTTPS via reverse proxy (required for add-to-home-screen).

---

## 7. Home Assistant integration

**Inbound (HA → CES)**

- Webhook: `POST /api/v1/webhooks/ha` with actions e.g. `CES_SNOOZE_60`, `CES_MARK_REVIEWED`.
- Shared secret header (`HA_WEBHOOK_SECRET`).
- Scheduled automation may call `POST /api/v1/nudges/evaluate`.

**Outbound (CES → HA)**

- Long-lived token: `HA_TOKEN`, `HA_URL`.
- Services: `light.turn_on` (gentle pulse), `notify.mobile_app_*`, user scripts.

Example automation pattern is in [README.md](README.md); expanded examples will live in `docs/ha-examples.yaml` at implementation time.

---

## 8. AI usage strategy

- **Triggers:** user button (“Break this down”, “Plan my day”); optional user-enabled HA schedule.
- **No** background polling or always-on AI.
- **Provider:** OpenAI-compatible (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`).
- **Cache:** `ai_interactions.input_hash` + full response JSON.
- **Logging:** every call recorded for review and cost transparency.
- **Paste workflow:** user may paste external Claude output and save as decomposition without API call.

---

## 9. Implementation roadmap

### Phase 1 — Foundation

- Scaffold FastAPI, Alembic, Dockerfiles, `deploy/docker-compose.yml` (api + web only).
- Models + initial migration.
- Context and task CRUD; API key auth.
- HA zone reader; `GET /contexts/current` (degrade gracefully if HA unavailable).

**Exit:** Compose runs on Unraid; tasks persist in external MariaDB; current context from HA or override.

### Phase 2 — Timeline and timers

- SvelteKit app, API client, context-aware home.
- Day timeline; focus session start/stop with countdown.
- End-of-block reflection prompt.

**Exit:** Daily loop on iPhone PWA and Windows; timer syncs on session end.

### Phase 3 — On-demand AI

- `POST /ai/decompose`; cache; edit-before-save UI.
- Optional `POST /ai/plan-day`.

**Exit:** No background AI; cache hits on repeat inputs; all calls logged.

### Phase 4 — Nudges and HA actions

- `nudge_rules` CRUD; evaluate endpoint; HA execute helper.
- In-app banner: Mark done / Snooze 60 / Dismiss today.
- `docs/ha-examples.yaml`.

**Exit:** Example evening-at-home rule fires once, logs outcome, respects snooze/dismiss.

### Phase 5 — Context switching and hyperfocus

- Default views per context.
- Hyperfocus session type with end condition and checkpoint.
- Zone change updates UI (poll or WebSocket).

**Exit:** HA zone change shifts default task set without manual refresh.

### Phase 6 — Polish and safeguards

- Pause mode (disables nudge evaluation).
- `GET /export`; backup documentation.
- PWA offline queue.
- Rate limits on AI routes; deploy docs.

**Exit:** Export works; pause mode works; offline shell usable.

### Suggested PR sequence (when building)

1. `deploy/` + backend skeleton + migration  
2. Task/context CRUD + HA zones  
3. SvelteKit shell + tasks + context badge  
4. Focus sessions + timeline  
5. AI decompose + cache  
6. Nudges + webhooks + review  
7. Offline + export + docs  

---

## 10. Deployment (Unraid + external MariaDB)

### Compose services (no MariaDB container)

| Service | Role |
|---------|------|
| `ces-api` | FastAPI on port 8000, healthcheck `GET /health` |
| `ces-web` | SvelteKit build behind nginx; proxy `/api` → api |

Network: `bridge`. Container must reach LAN MariaDB and HA (use host IP, not `localhost`, for DB).

### Environment variables (`.env.example`)

```bash
DATABASE_URL=mysql+asyncmy://ces_user:password@192.168.x.x:3306/ces
CES_API_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
HA_URL=http://homeassistant.local:8123
HA_TOKEN=
HA_WEBHOOK_SECRET=
CES_PUBLIC_URL=https://ces.yourdomain.local
```

### MariaDB prerequisites

1. Create database `ces` and user with least privilege on `ces.*`.
2. utf8mb4 / utf8mb4_unicode_ci.
3. Run `alembic upgrade head` on API container start (entrypoint).

### Security

- Secrets via Unraid Docker env or gitignored `.env` only.
- CORS restricted to `CES_PUBLIC_URL`.
- Separate webhook secret for HA.
- Optional reverse proxy (Traefik, NPM) for HTTPS.

---

## 11. Prerequisites before first deploy

- [ ] MariaDB host, port, database `ces`, credentials reachable from Docker bridge
- [ ] Home Assistant long-lived access token
- [ ] OpenAI-compatible API key and base URL (if using local proxy)
- [ ] Reverse proxy hostname with HTTPS (recommended for iOS PWA)
- [ ] Unraid paths for compose and optional volume for file cache
- [ ] `CES_API_KEY` and `HA_WEBHOOK_SECRET` generated and stored securely

---

## 12. Safeguards and sustainability

- User owns all data; export and deletion supported (phase 6).
- **Pause mode** disables nudge evaluation.
- Nudges are configurable; no public shaming or escalating harassment.
- Emphasis on small completable actions and reflection — not streaks or perfection.
- Complements professional support, exercise, sleep hygiene — does not replace them.

---

## 13. Testing strategy (at implementation)

- **Backend:** pytest; contract tests for CRUD; mocked HA and AI responses.
- **Frontend:** Vitest for timeline/timer logic.
- **Manual:** HA webhook test; iOS add-to-home-screen over HTTPS.

---

## 14. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| MariaDB unreachable from container | Use LAN IP; verify with client from inside container |
| HA TLS / local certs | Internal HTTP or proper CA; no `verify=False` in production |
| iOS PWA limits | HTTPS; use HA notify as primary alert channel |
| AI cost | Cache, confirm-before-call UI, cheap default model via env |
| Scope creep | Phase gates; defer calendar sync and multi-user auth |

---

## Appendix: Evidence

Brief pointers aligned with the app design document:

- **Implementation intentions:** Gollwitzer; meta-analytic medium-to-large effects on goal attainment; benefits for executive function in ADHD samples.
- **Time externalisation:** ADHD time perception deficits; visual timers and schedules as compensatory aids (Barkley model, clinical reviews).
- **Gentle accountability:** Nudge principles (salient, autonomy-preserving); body doubling and environmental cue reports for initiation support.
- **Overall pattern:** Organisational skills training and context-dependent cueing for adults with ADHD.

Full citations and rationale belong in [docs/architecture/REFERENCE.md](docs/architecture/REFERENCE.md) once imported.

---

*MVP implements phases 1–4 core APIs and phase 5–6 subsets (export, pause, review). See [docs/REMAINING.md](docs/REMAINING.md).*