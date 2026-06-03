from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.models import Context, Task
from app.schemas import TaskCreate, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _serialize(task: Task, context_slug: str | None = None) -> dict:
    return {
        "id": task.id,
        "description": task.description,
        "context_id": task.context_id,
        "context_slug": context_slug,
        "is_preferred": task.is_preferred,
        "status": task.status,
        "due_at": task.due_at.isoformat() if task.due_at else None,
        "ai_decomposition": task.ai_decomposition,
        "implementation_intention": task.implementation_intention,
        "sort_order": task.sort_order,
    }


@router.get("")
def list_tasks(
    context_slug: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
) -> list[dict]:
    q = select(Task, Context.slug).join(Context, Task.context_id == Context.id)
    if context_slug:
        q = q.where(Context.slug == context_slug)
    if status:
        q = q.where(Task.status == status)
    q = q.order_by(Task.sort_order, Task.id)
    rows = db.execute(q).all()
    return [_serialize(task, slug) for task, slug in rows]


@router.post("", dependencies=[Depends(require_api_key)])
def create_task(body: TaskCreate, db: Session = Depends(get_db)) -> dict:
    if not db.get(Context, body.context_id):
        raise HTTPException(404, "Context not found")
    task = Task(**body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    slug = db.get(Context, task.context_id).slug
    return _serialize(task, slug)


@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        select(Task, Context.slug)
        .join(Context, Task.context_id == Context.id)
        .where(Task.id == task_id)
    ).first()
    if not row:
        raise HTTPException(404, "Task not found")
    task, slug = row
    return _serialize(task, slug)


@router.patch("/{task_id}", dependencies=[Depends(require_api_key)])
def update_task(task_id: int, body: TaskUpdate, db: Session = Depends(get_db)) -> dict:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    data = body.model_dump(exclude_unset=True)
    if "context_id" in data and not db.get(Context, data["context_id"]):
        raise HTTPException(404, "Context not found")
    for key, val in data.items():
        setattr(task, key, val)
    db.commit()
    db.refresh(task)
    slug = db.get(Context, task.context_id).slug
    return _serialize(task, slug)


@router.delete("/{task_id}", dependencies=[Depends(require_api_key)])
def delete_task(task_id: int, db: Session = Depends(get_db)) -> dict:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}