import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AIInteraction, Context, FocusSession, Nudge, ReflectionLog, Task

router = APIRouter(tags=["review"])


@router.get("/review/weekly")
def weekly_review(db: Session = Depends(get_db)) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    nudges = db.scalars(select(Nudge).where(Nudge.fired_at >= since)).all()
    reflections = db.scalars(
        select(ReflectionLog).where(ReflectionLog.logged_at >= since)
    ).all()
    sessions = db.scalars(
        select(FocusSession).where(FocusSession.started_at >= since)
    ).all()
    tasks_done = db.scalar(
        select(func.count())
        .select_from(Task)
        .where(Task.status == "done")
    ) or 0

    answered = sum(1 for n in nudges if n.user_response)
    return {
        "period_days": 7,
        "nudges_fired": len(nudges),
        "nudges_answered": answered,
        "reflections": [
            {
                "id": r.id,
                "logged_at": r.logged_at.isoformat(),
                "worked": r.worked,
                "blocked": r.blocked,
                "note": r.note,
            }
            for r in reflections
        ],
        "focus_sessions": len(sessions),
        "tasks_done_total": tasks_done,
    }


@router.get("/export")
def export_data(db: Session = Depends(get_db)) -> dict:
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "contexts": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "location_rules": c.location_rules,
            }
            for c in db.scalars(select(Context)).all()
        ],
        "tasks": [
            {
                "id": t.id,
                "description": t.description,
                "context_id": t.context_id,
                "status": t.status,
                "ai_decomposition": t.ai_decomposition,
            }
            for t in db.scalars(select(Task)).all()
        ],
        "ai_interactions": len(db.scalars(select(AIInteraction)).all()),
    }


def ha_service_configured() -> bool:
    from app.config import settings

    return bool(settings.ha_url and settings.ha_token)


def ai_configured() -> bool:
    from app.config import settings

    return bool(settings.openai_api_key)