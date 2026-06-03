from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api import ai_routes, contexts, focus, ha, nudges, review, tasks, timeline
from app.api.review import ai_configured, ha_service_configured
from app.config import settings
from app.db import get_db
from app.models import Context

app = FastAPI(title="CES API", version="0.2.0-mvp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = "/api/v1"

app.include_router(review.router, prefix=f"{prefix}")
app.include_router(contexts.router, prefix=f"{prefix}")
app.include_router(tasks.router, prefix=f"{prefix}")
app.include_router(focus.router, prefix=f"{prefix}")
app.include_router(timeline.router, prefix=f"{prefix}")
app.include_router(ai_routes.router, prefix=f"{prefix}")
app.include_router(nudges.router, prefix=f"{prefix}")
app.include_router(ha.router, prefix=f"{prefix}")
app.include_router(ha.webhook_router, prefix=f"{prefix}")


@app.get("/health")
def health_root(db: Session = Depends(get_db)) -> dict:
    try:
        db.scalar(select(func.count()).select_from(Context))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "ces-api",
        "database": db_ok,
        "ha_configured": ha_service_configured(),
        "ai_configured": ai_configured(),
    }