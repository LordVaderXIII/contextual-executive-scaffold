from typing import Any

import httpx

from app.config import settings


def parse_mock_zones() -> dict[str, str]:
    mapping: dict[str, str] = {}
    for part in settings.ha_mock_zones.split(","):
        part = part.strip()
        if ":" in part:
            zone, slug = part.split(":", 1)
            mapping[zone.strip()] = slug.strip()
    return mapping


def ha_configured() -> bool:
    return bool(settings.ha_url and settings.ha_token)


async def fetch_zone_state() -> dict[str, Any]:
    if not ha_configured():
        return {
            "source": "mock",
            "configured": False,
            "zones": parse_mock_zones(),
            "current_zone": "home",
        }
    url = f"{settings.ha_url.rstrip('/')}/api/states/{settings.ha_person_entity}"
    headers = {"Authorization": f"Bearer {settings.ha_token}"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            zone = data.get("attributes", {}).get("zone") or data.get("state")
            return {
                "source": "ha",
                "configured": True,
                "entity": settings.ha_person_entity,
                "current_zone": zone,
                "raw_state": data.get("state"),
            }
    except Exception as exc:
        return {
            "source": "degraded",
            "configured": True,
            "error": str(exc),
            "zones": parse_mock_zones(),
            "current_zone": "home",
        }


async def execute_ha_service(domain: str, service: str, data: dict[str, Any]) -> dict[str, Any]:
    if not ha_configured():
        return {
            "ok": True,
            "mock": True,
            "message": f"Mock executed {domain}.{service}",
            "data": data,
        }
    url = f"{settings.ha_url.rstrip('/')}/api/services/{domain}/{service}"
    headers = {
        "Authorization": f"Bearer {settings.ha_token}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=data)
            resp.raise_for_status()
            return {"ok": True, "mock": False, "status_code": resp.status_code}
    except Exception as exc:
        return {"ok": False, "mock": False, "error": str(exc)}