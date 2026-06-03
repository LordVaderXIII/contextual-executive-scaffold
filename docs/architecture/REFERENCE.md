# CES — Design architecture reference

> **Status:** Stub. Replace this file (or add a linked file) with your full design export from Claude.

## Purpose of this document

This is the **canonical design architecture reference** for Contextual Executive Scaffold: product goals, feature specifications, scientific rationale, data model intent, HA integration philosophy, and sustainability safeguards.

The [BUILD_PLAN.md](../../BUILD_PLAN.md) in the repo root translates this design into a technical implementation plan (FastAPI, SvelteKit, external MariaDB on Unraid, phases, API list).

## What to paste here

Import your **App Design Document** (e.g. “CONTEXTUAL EXECUTIVE SCAFFOLD (CES) — App Design Document v1.0, May 2026”), including:

1. Purpose and goals  
2. System architecture (stack, HA, location/context)  
3. Core features with scientific basis (§3.1–3.6)  
4. Data model (MariaDB tables)  
5. AI usage strategy  
6. Implementation roadmap (MVP phases)  
7. Sustainability and health safeguards  
8. Evidence / references  

Alternatively, save a copy as `docs/design/CES-App-Design-v1.0.md` and replace this file with a short index that links to it.

## Quick summary (until full import)

Until you paste the full document, the following summary anchors the repo:

- **Host:** Unraid Docker; **database:** external MariaDB (not in CES compose).  
- **Stack:** FastAPI backend, SvelteKit PWA, Home Assistant for zones and gentle nudges, OpenAI-compatible AI on-demand only.  
- **Principles:** External structure without punitive nagging; user-owned data; context-aware task surfacing; hyperfocus containment; reflection logging.

See [BUILD_PLAN.md](../../BUILD_PLAN.md) for technical phases and schema extensions planned for MVP.

---

*After importing, delete or shorten the “Quick summary” section above so this file is not duplicated.*