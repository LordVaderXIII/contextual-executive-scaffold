from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Context
from app.services import ha as ha_service
from app.services.settings_store import SETTING_CONTEXT_OVERRIDE, get_setting


async def resolve_current_context(db: Session) -> dict[str, Any]:
    override = get_setting(db, SETTING_CONTEXT_OVERRIDE)
    if isinstance(override, dict) and override.get("slug"):
        ctx = db.scalar(select(Context).where(Context.slug == override["slug"]))
        if ctx:
            return _context_payload(ctx, source="manual_override", ha=await ha_service.fetch_zone_state())

    zone_info = await ha_service.fetch_zone_state()
    zone = zone_info.get("current_zone")
    contexts = db.scalars(select(Context).where(Context.is_active.is_(True))).all()

    if zone:
        for ctx in contexts:
            rules = ctx.location_rules or {}
            zones = rules.get("zones") or rules.get("ha_zones") or []
            if zone in zones:
                return _context_payload(ctx, source="ha_zone", ha=zone_info)

        mock_map = zone_info.get("zones") or ha_service.parse_mock_zones()
        slug = mock_map.get(zone) if isinstance(mock_map, dict) else None
        if slug:
            ctx = db.scalar(select(Context).where(Context.slug == slug))
            if ctx:
                return _context_payload(ctx, source="ha_mock_map", ha=zone_info)

    last = get_setting(db, "last_known_context", {})
    if isinstance(last, dict) and last.get("slug"):
        ctx = db.scalar(select(Context).where(Context.slug == last["slug"]))
        if ctx:
            return _context_payload(ctx, source="last_known", ha=zone_info)

    if contexts:
        return _context_payload(contexts[0], source="default_first", ha=zone_info)

    return {
        "context": None,
        "source": "none",
        "ha": zone_info,
    }


def _context_payload(ctx: Context, source: str, ha: dict[str, Any]) -> dict[str, Any]:
    return {
        "context": {
            "id": ctx.id,
            "name": ctx.name,
            "slug": ctx.slug,
            "accent_hue": ctx.accent_hue,
            "location_rules": ctx.location_rules,
        },
        "source": source,
        "ha": ha,
    }