"""Seed disposable test data for local Docker verification."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.db import SessionLocal
from app.models import (
    Context,
    FocusSession,
    NudgeRule,
    ReflectionLog,
    Task,
)
from app.services.settings_store import SETTING_PAUSE_MODE, set_setting

FAKE_CONTEXTS = [
    {
        "name": "Home — evening wind-down",
        "slug": "home-evening",
        "accent_hue": 182,
        "location_rules": {"zones": ["home"], "ha_zones": ["home"]},
        "is_active": True,
    },
    {
        "name": "Work / study desk",
        "slug": "work-desk",
        "accent_hue": 255,
        "location_rules": {"zones": ["work", "office"], "ha_zones": ["work"]},
        "is_active": True,
    },
    {
        "name": "Errands & admin",
        "slug": "errands",
        "accent_hue": 48,
        "location_rules": {"zones": ["not_home"]},
        "is_active": True,
    },
]

FAKE_TASKS = [
    {
        "context_slug": "home-evening",
        "description": "Unload dishwasher (2 min) — if kitchen light on, then start with top rack",
        "status": "pending",
        "is_preferred": False,
        "sort_order": 1,
    },
    {
        "context_slug": "home-evening",
        "description": "Lay out tomorrow meds + water bottle on counter",
        "status": "pending",
        "is_preferred": False,
        "sort_order": 2,
    },
    {
        "context_slug": "work-desk",
        "description": "Reply to one client email with bullet summary only",
        "status": "in_progress",
        "is_preferred": True,
        "sort_order": 1,
    },
    {
        "context_slug": "work-desk",
        "description": "Draft CES timeline view wireframe notes (15 min timer)",
        "status": "pending",
        "is_preferred": True,
        "sort_order": 2,
    },
    {
        "context_slug": "errands",
        "description": "Book GP follow-up (call during lunch window)",
        "status": "snoozed",
        "is_preferred": False,
        "sort_order": 1,
    },
]

NUDGE_RULES = [
    {
        "context_slug": "home-evening",
        "name": "Evening at home — pending review",
        "cron_or_ha_trigger": "Daily · 20:00",
        "intensity": "gentle",
        "enabled": True,
    },
    {
        "context_slug": "work-desk",
        "name": "Left work, tasks still open",
        "cron_or_ha_trigger": "Zone: leaves Office",
        "intensity": "standard",
        "enabled": False,
    },
]


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(func.count()).select_from(Context))
        if existing and existing > 0:
            print("Seed skipped: contexts already present")
            return

        slug_to_id: dict[str, int] = {}
        for row in FAKE_CONTEXTS:
            ctx = Context(**row)
            db.add(ctx)
            db.flush()
            slug_to_id[ctx.slug] = ctx.id

        task_ids: list[int] = []
        for row in FAKE_TASKS:
            task = Task(
                description=row["description"],
                context_id=slug_to_id[row["context_slug"]],
                status=row["status"],
                is_preferred=row["is_preferred"],
                sort_order=row["sort_order"],
            )
            db.add(task)
            db.flush()
            task_ids.append(task.id)

        now = datetime.now(timezone.utc)
        db.add(
            FocusSession(
                task_id=task_ids[2],
                started_at=now - timedelta(hours=2),
                ended_at=now - timedelta(hours=1, minutes=10),
                session_type="normal",
                planned_minutes=50,
                notes="Email draft block",
            )
        )
        db.add(
            FocusSession(
                task_id=task_ids[3],
                started_at=now - timedelta(minutes=25),
                session_type="hyperfocus",
                planned_minutes=15,
                end_condition="Stop when 15-minute timer ends",
            )
        )

        for row in NUDGE_RULES:
            db.add(
                NudgeRule(
                    name=row["name"],
                    context_id=slug_to_id[row["context_slug"]],
                    cron_or_ha_trigger=row["cron_or_ha_trigger"],
                    intensity=row["intensity"],
                    enabled=row["enabled"],
                )
            )

        db.add(
            ReflectionLog(
                worked="Backoff logic — got into flow for 50 min",
                blocked="Expense report, still not started",
                note="Insight came fast, execution stalled after.",
            )
        )

        db.commit()
        set_setting(db, SETTING_PAUSE_MODE, {"enabled": False})
        print(
            f"Seeded {len(FAKE_CONTEXTS)} contexts, {len(FAKE_TASKS)} tasks, "
            f"{len(NUDGE_RULES)} nudge rules"
        )


if __name__ == "__main__":
    seed()