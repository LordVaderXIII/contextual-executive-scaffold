from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.models import Context, Task
from app.schemas import ContextCreate, ContextOverride, ContextUpdate
from app.services import context_resolver
from app.services.settings_store import SETTING_CONTEXT_OVERRIDE, set_setting

router = APIRouter(prefix="/contexts", tags=["contexts"])


def _serialize(ctx: Context, db: Session) -> dict:
    count = db.scalar(
        select(func.count()).select_from(Task).where(Task.context_id == ctx.id)
    )
    return {
        "id": ctx.id,
        "name": ctx.name,
        "slug": ctx.slug,
        "location_rules": ctx.location_rules,
        "default_priorities": ctx.default_priorities,
        "accent_hue": ctx.accent_hue,
        "is_active": ctx.is_active,
        "task_count": count or 0,
    }


@router.get("")
def list_contexts(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Context).order_by(Context.id)).all()
    return [_serialize(c, db) for c in rows]


@router.post("", dependencies=[Depends(require_api_key)])
def create_context(body: ContextCreate, db: Session = Depends(get_db)) -> dict:
    if db.scalar(select(Context).where(Context.slug == body.slug)):
        raise HTTPException(409, "Slug already exists")
    ctx = Context(**body.model_dump())
    db.add(ctx)
    db.commit()
    db.refresh(ctx)
    return _serialize(ctx, db)


@router.get("/current")
async def current_context(db: Session = Depends(get_db)) -> dict:
    from app.services.settings_store import get_setting

    result = await context_resolver.resolve_current_context(db)
    if result.get("context"):
        slug = result["context"]["slug"]
        last = get_setting(db, "last_known_context", {})
        if not isinstance(last, dict) or last.get("slug") != slug:
            set_setting(db, "last_known_context", {"slug": slug})
    return result


@router.post("/override", dependencies=[Depends(require_api_key)])
def override_context(body: ContextOverride, db: Session = Depends(get_db)) -> dict:
    if body.slug:
        if not db.scalar(select(Context).where(Context.slug == body.slug)):
            raise HTTPException(404, "Context not found")
        set_setting(db, SETTING_CONTEXT_OVERRIDE, {"slug": body.slug})
    else:
        set_setting(db, SETTING_CONTEXT_OVERRIDE, None)
    return {"ok": True, "override": body.slug}


@router.get("/{context_id}")
def get_context(context_id: int, db: Session = Depends(get_db)) -> dict:
    ctx = db.get(Context, context_id)
    if not ctx:
        raise HTTPException(404, "Context not found")
    return _serialize(ctx, db)


@router.patch("/{context_id}", dependencies=[Depends(require_api_key)])
def update_context(
    context_id: int, body: ContextUpdate, db: Session = Depends(get_db)
) -> dict:
    ctx = db.get(Context, context_id)
    if not ctx:
        raise HTTPException(404, "Context not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(ctx, key, val)
    db.commit()
    db.refresh(ctx)
    return _serialize(ctx, db)


@router.delete("/{context_id}", dependencies=[Depends(require_api_key)])
def delete_context(context_id: int, db: Session = Depends(get_db)) -> dict:
    ctx = db.get(Context, context_id)
    if not ctx:
        raise HTTPException(404, "Context not found")
    db.delete(ctx)
    db.commit()
    return {"ok": True}