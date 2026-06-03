from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Context, FocusSession, Task

router = APIRouter(tags=["timeline"])


@router.get("/timeline")
def timeline(
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
) -> dict:
    today = date.today()
    start = start or today
    end = end or today
    start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end, time.max, tzinfo=timezone.utc)

    tasks = db.execute(
        select(Task, Context.slug, Context.name)
        .join(Context, Task.context_id == Context.id)
        .where(
            (Task.due_at.is_(None)) | ((Task.due_at >= start_dt) & (Task.due_at <= end_dt))
        )
        .order_by(Task.sort_order, Task.id)
    ).all()

    sessions = db.scalars(
        select(FocusSession)
        .where(FocusSession.started_at >= start_dt, FocusSession.started_at <= end_dt)
        .order_by(FocusSession.started_at)
    ).all()

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "tasks": [
            {
                "id": t.id,
                "description": t.description,
                "context_slug": slug,
                "context_name": cname,
                "status": t.status,
                "due_at": t.due_at.isoformat() if t.due_at else None,
                "is_preferred": t.is_preferred,
            }
            for t, slug, cname in tasks
        ],
        "sessions": [
            {
                "id": s.id,
                "task_id": s.task_id,
                "started_at": s.started_at.isoformat(),
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "session_type": s.session_type,
                "end_condition": s.end_condition,
            }
            for s in sessions
        ],
    }