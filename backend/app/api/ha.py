from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.config import settings
from app.db import get_db
from app.schemas import HAExecuteRequest, HAWebhookPayload
from app.services import ha as ha_service
from app.services import nudges as nudge_service

router = APIRouter(prefix="/ha", tags=["ha"])


@router.get("/zones")
async def zones() -> dict:
    return await ha_service.fetch_zone_state()


@router.post("/execute", dependencies=[Depends(require_api_key)])
async def execute(body: HAExecuteRequest) -> dict:
    return await ha_service.execute_ha_service(body.domain, body.service, body.data)


webhook_router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@webhook_router.post("/ha")
def ha_webhook(
    body: HAWebhookPayload,
    db: Session = Depends(get_db),
    x_ha_secret: str | None = Header(default=None, alias="X-HA-Secret"),
) -> dict:
    if settings.ha_webhook_secret and x_ha_secret != settings.ha_webhook_secret:
        raise HTTPException(401, "Invalid webhook secret")

    if body.nudge_id:
        from app.models import Nudge

        nudge = db.get(Nudge, body.nudge_id)
        if nudge:
            nudge.user_response = body.action
            db.commit()

    action = body.action.upper()
    if action in ("CES_SNOOZE_60", "SNOOZE_60"):
        return {"ok": True, "action": "snooze_60"}
    if action in ("CES_MARK_REVIEWED", "MARK_REVIEWED"):
        return {"ok": True, "action": "mark_reviewed"}
    if action == "EVALUATE_NUDGES":
        return nudge_service.evaluate_rules(db, trigger="ha_webhook")
    return {"ok": True, "action": body.action}