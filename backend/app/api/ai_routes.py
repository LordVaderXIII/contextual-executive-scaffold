from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.models import Context, Task
from app.schemas import AIDecomposeRequest, AIPlanDayRequest
from app.services import ai as ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/decompose", dependencies=[Depends(require_api_key)])
async def decompose(body: AIDecomposeRequest, db: Session = Depends(get_db)) -> dict:
    description = body.description
    context_name = None
    task = None
    if body.task_id:
        task = db.get(Task, body.task_id)
        if not task:
            raise HTTPException(404, "Task not found")
        description = task.description
        ctx = db.get(Context, task.context_id)
        context_name = ctx.name if ctx else None

    if not description:
        raise HTTPException(400, "description or task_id required")

    if body.paste_response:
        result = {**body.paste_response, "source": "paste", "cached": False}
        ihash = ai_service.input_hash("decompose", {"description": description})
        ai_service.save_interaction(db, "decompose", ihash, description[:200], result)
        if task:
            task.ai_decomposition = result
            task.implementation_intention = result.get("implementation_intention")
            db.commit()
        return result

    payload = {"description": description, "context": context_name}
    ihash = ai_service.input_hash("decompose", payload)
    cached = ai_service.get_cached(db, "decompose", ihash)
    if cached:
        return cached

    result = await ai_service.decompose_task(description, context_name)
    ai_service.save_interaction(db, "decompose", ihash, description[:200], result)
    if task:
        task.ai_decomposition = result
        task.implementation_intention = result.get("implementation_intention")
        db.commit()
    return result


@router.post("/plan-day", dependencies=[Depends(require_api_key)])
async def plan_day(body: AIPlanDayRequest, db: Session = Depends(get_db)) -> dict:
    pending = db.scalars(
        select(Task).where(Task.status.in_(["pending", "in_progress"])).limit(5)
    ).all()
    descriptions = [t.description for t in pending]
    return await ai_service.plan_day(descriptions)