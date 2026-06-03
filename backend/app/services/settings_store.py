from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AppSetting

SETTING_CONTEXT_OVERRIDE = "context_override"
SETTING_PAUSE_MODE = "pause_mode"
SETTING_HA_ENTITIES = "ha_entities"
SETTING_DISMISS_UNTIL = "dismiss_nudges_until"


def get_setting(db: Session, key: str, default: Any = None) -> Any:
    row = db.get(AppSetting, key)
    if row is None or row.value is None:
        return default
    return row.value


def set_setting(db: Session, key: str, value: Any) -> None:
    row = db.get(AppSetting, key)
    if row is None:
        db.add(AppSetting(key=key, value=value))
    else:
        row.value = value
    db.commit()


def is_pause_mode(db: Session) -> bool:
    val = get_setting(db, SETTING_PAUSE_MODE, {"enabled": False})
    return bool(val.get("enabled")) if isinstance(val, dict) else bool(val)