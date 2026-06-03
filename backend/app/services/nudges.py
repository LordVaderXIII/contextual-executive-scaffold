from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Context, Nudge, NudgeRule, Task
from app.services.settings_store import SETTING_DISMISS_UNTIL, get_setting, is_pause_mode


def evaluate_rules(db: Session, trigger: str = "manual") -> dict[str, Any]:
    if is_pause_mode(db):
        return {
            "evaluated": False,
            "reason": "pause_mode",
            "ha_actions": [],
            "app_banner": None,
        }

    dismiss_until = get_setting(db, SETTING_DISMISS_UNTIL)
    if isinstance(dismiss_until, dict) and dismiss_until.get("until"):
        try:
            until = datetime.fromisoformat(dismiss_until["until"].replace("Z", "+00:00"))
            if until > datetime.now(timezone.utc):
                return {
                    "evaluated": False,
                    "reason": "dismissed_for_today",
                    "ha_actions": [],
                    "app_banner": None,
                }
        except ValueError:
            pass

    rules = db.scalars(
        select(NudgeRule).where(NudgeRule.enabled.is_(True)).order_by(NudgeRule.id)
    ).all()
    if not rules:
        return {
            "evaluated": True,
            "reason": "no_enabled_rules",
            "ha_actions": [],
            "app_banner": None,
        }

    rule = rules[0]
    ctx = db.get(Context, rule.context_id) if rule.context_id else None
    pending = 0
    if ctx:
        pending = len(
            db.scalars(
                select(Task).where(
                    Task.context_id == ctx.id,
                    Task.status.in_(["pending", "in_progress"]),
                )
            ).all()
        )

    nudge = Nudge(
        rule_id=rule.id,
        context_id=rule.context_id,
        nudge_type=trigger,
        metadata_={
            "rule_name": rule.name,
            "pending_tasks": pending,
            "intensity": rule.intensity,
        },
    )
    db.add(nudge)
    db.commit()
    db.refresh(nudge)

    ha_actions = []
    if rule.intensity.lower() == "gentle":
        ha_actions.append(
            {
                "domain": "light",
                "service": "turn_on",
                "data": {"brightness_pct": 25, "rgb_color": [255, 220, 180]},
            }
        )

    return {
        "evaluated": True,
        "nudge_id": nudge.id,
        "ha_actions": ha_actions,
        "app_banner": {
            "title": rule.name,
            "message": f"{pending} pending items for {ctx.name if ctx else 'current context'}",
            "actions": ["mark_done", "snooze_60", "dismiss_today"],
        },
    }