# Architecture documentation

This folder holds the **canonical product and system design** for Contextual Executive Scaffold (CES). The executable build sequence lives in the repo root: [BUILD_PLAN.md](../../BUILD_PLAN.md).

## How to use this folder

1. **Import your Claude design export** into `REFERENCE.md`, or add a versioned file (e.g. `CES-App-Design-v1.0.md`) and link it below.
2. Treat that file as the source of truth for *what* and *why* (features, evidence, UX intent, HA philosophy).
3. When design changes, update the reference first, then align `BUILD_PLAN.md` and note the change in its changelog table.

## Document roles

| File | Role |
|------|------|
| [REFERENCE.md](REFERENCE.md) | Canonical app design / architecture (you maintain this import) |
| [BUILD_PLAN.md](../../BUILD_PLAN.md) | Implementation roadmap: stack, phases, schema, API, Unraid deploy |
| [README.md](../../README.md) | Public project intro and philosophy |

## Canonical reference

| Document | Status |
|----------|--------|
| [REFERENCE.md](REFERENCE.md) | Stub — replace or expand with your full App Design Document |

You may keep multiple versions under [../design/](../design/) (PDF, markdown exports) and point the table above at the active file.

## If BUILD_PLAN and REFERENCE disagree

1. Decide which document reflects your current intent.
2. Update the other to match, or document the intentional difference in `BUILD_PLAN.md` changelog.
3. Do not change application code until you are in an implementation phase — documentation only until then.