from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.db import get_db
from app.models import Nudge, NudgeRule
from app.schemas import NudgeRuleCreate, NudgeRuleUpdate, PauseMode
from app.services import nudges as nudge_service
from app.services.settings_store import (
    SETTING_DISMISS_UNTIL,
    SETTING_PAUSE_MODE,
    get_setting,
    set_setting,
)

router = APIRouter(tags=["nudges"])


def _rule_dict(rule: NudgeRule) -> dict:
    return {
        "id": rule.id,
        "name": rule.name,
        "context_id": rule.context_id,
        "cron_or_ha_trigger": rule.cron_or_ha_trigger,
        "conditions": rule.conditions,
        "intensity": rule.intensity,
        "enabled": rule.enabled,
    }


@router.get("/nudge-rules")
def list_rules(db: Session = Depends(get_db)) -> list[dict]:
    return [_rule_dict(r) for r in db.scalars(select(NudgeRule).order_by(NudgeRule.id)).all()]


@router.post("/nudge-rules", dependencies=[Depends(require_api_key)])
def create_rule(body: NudgeRuleCreate, db: Session = Depends(get_db)) -> dict:
    rule = NudgeRule(**body.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_dict(rule)


@router.patch("/nudge-rules/{rule_id}", dependencies=[Depends(require_api_key)])
def update_rule(
    rule_id: int, body: NudgeRuleUpdate, db: Session = Depends(get_db)
) -> dict:
    rule = db.get(NudgeRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return _rule_dict(rule)


@router.delete("/nudge-rules/{rule_id}", dependencies=[Depends(require_api_key)])
def delete_rule(rule_id: int, db: Session = Depends(get_db)) -> dict:
    rule = db.get(NudgeRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}


@router.post("/nudges/evaluate", dependencies=[Depends(require_api_key)])
def evaluate(trigger: str = "manual", db: Session = Depends(get_db)) -> dict:
    return nudge_service.evaluate_rules(db, trigger=trigger)


@router.post("/settings/pause", dependencies=[Depends(require_api_key)])
def set_pause(body: PauseMode, db: Session = Depends(get_db)) -> dict:
    set_setting(db, SETTING_PAUSE_MODE, {"enabled": body.enabled})
    return {"pause_mode": body.enabled}


@router.get("/settings/pause")
def get_pause(db: Session = Depends(get_db)) -> dict:
    val = get_setting(db, SETTING_PAUSE_MODE, {"enabled": False})
    return val if isinstance(val, dict) else {"enabled": bool(val)}


@router.patch("/nudges/{nudge_id}/response", dependencies=[Depends(require_api_key)])
def nudge_response(
    nudge_id: int, response: str, db: Session = Depends(get_db)
) -> dict:
    nudge = db.get(Nudge, nudge_id)
    if not nudge:
        raise HTTPException(404, "Nudge not found")
    nudge.user_response = response
    if response == "dismiss_today":
        until = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        set_setting(db, SETTING_DISMISS_UNTIL, {"until": until})
    db.commit()
    return {"ok": True, "response": response}