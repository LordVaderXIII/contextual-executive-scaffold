from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.models import FocusSession, ReflectionLog, Task
from app.schemas import FocusSessionCreate, FocusSessionEnd

router = APIRouter(prefix="/focus-sessions", tags=["focus"])


def _serialize(session: FocusSession) -> dict:
    return {
        "id": session.id,
        "task_id": session.task_id,
        "started_at": session.started_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "session_type": session.session_type,
        "planned_minutes": session.planned_minutes,
        "end_condition": session.end_condition,
        "notes": session.notes,
        "active": session.ended_at is None,
    }


@router.get("")
def list_sessions(active_only: bool = False, db: Session = Depends(get_db)) -> list[dict]:
    q = select(FocusSession).order_by(FocusSession.started_at.desc())
    if active_only:
        q = q.where(FocusSession.ended_at.is_(None))
    return [_serialize(s) for s in db.scalars(q).all()]


@router.post("", dependencies=[Depends(require_api_key)])
def start_session(body: FocusSessionCreate, db: Session = Depends(get_db)) -> dict:
    if body.task_id and not db.get(Task, body.task_id):
        raise HTTPException(404, "Task not found")
    session = FocusSession(**body.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return _serialize(session)


@router.patch("/{session_id}", dependencies=[Depends(require_api_key)])
def end_session(
    session_id: int, body: FocusSessionEnd, db: Session = Depends(get_db)
) -> dict:
    session = db.get(FocusSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session.ended_at:
        raise HTTPException(400, "Session already ended")
    session.ended_at = body.ended_at or datetime.now(timezone.utc)
    if body.notes:
        session.notes = body.notes
    if body.reflection:
        db.add(
            ReflectionLog(
                session_id=session.id,
                worked=body.reflection.get("worked"),
                blocked=body.reflection.get("blocked"),
                note=body.reflection.get("note"),
            )
        )
    db.commit()
    db.refresh(session)
    return _serialize(session)