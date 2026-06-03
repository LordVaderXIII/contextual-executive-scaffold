import hashlib
import json
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AIInteraction


def input_hash(prompt_type: str, payload: dict[str, Any]) -> str:
    normalized = json.dumps({"prompt_type": prompt_type, **payload}, sort_keys=True)
    return hashlib.sha256(normalized.encode()).hexdigest()


def mock_decompose(description: str) -> dict[str, Any]:
    steps = [
        f"Open notes and write one sentence about: {description[:60]}",
        "Pick the smallest physical first action (under 2 minutes)",
        "Set a 15-minute timer and do only that first action",
        "Stop when the timer ends; log what happened",
    ]
    return {
        "micro_steps": [{"text": s, "done": False} for s in steps],
        "implementation_intention": (
            f"When I sit at my desk, I will open notes and write one sentence about "
            f"'{description[:40]}'."
        ),
        "source": "mock",
    }


def get_cached(db: Session, prompt_type: str, ihash: str) -> dict[str, Any] | None:
    row = db.scalar(
        select(AIInteraction)
        .where(AIInteraction.prompt_type == prompt_type, AIInteraction.input_hash == ihash)
        .order_by(AIInteraction.created_at.desc())
    )
    if row and row.full_response:
        return {**row.full_response, "cached": True, "interaction_id": row.id}
    return None


def save_interaction(
    db: Session,
    prompt_type: str,
    ihash: str,
    input_summary: str,
    response: dict[str, Any],
) -> AIInteraction:
    summary = response.get("implementation_intention") or str(response.get("micro_steps", ""))[:200]
    row = AIInteraction(
        prompt_type=prompt_type,
        input_hash=ihash,
        input_summary=input_summary,
        output_summary=summary[:500] if summary else None,
        full_response=response,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


async def decompose_task(description: str, context_name: str | None = None) -> dict[str, Any]:
    payload = {"description": description, "context": context_name}
    ihash = input_hash("decompose", payload)

    if settings.openai_api_key:
        prompt = (
            "Break this task into 3-5 micro-steps and one implementation intention "
            f"for ADHD executive support. Task: {description}. Context: {context_name or 'general'}. "
            'Respond as JSON: {"micro_steps":[{"text":"..."}],"implementation_intention":"..."}'
        )
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    json={
                        "model": settings.openai_model,
                        "messages": [
                            {"role": "system", "content": "You return only valid JSON."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.4,
                    },
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                parsed["source"] = "openai"
                parsed["input_hash"] = ihash
                return parsed
        except Exception:
            pass

    result = mock_decompose(description)
    result["input_hash"] = ihash
    return result


async def plan_day(tasks: list[str]) -> dict[str, Any]:
    blocks = [
        {"period": "morning", "focus": tasks[0] if tasks else "Pick one small start"},
        {"period": "afternoon", "focus": tasks[1] if len(tasks) > 1 else "Maintenance window"},
        {"period": "evening", "focus": tasks[2] if len(tasks) > 2 else "Wind-down review"},
    ]
    return {"blocks": blocks, "source": "mock" if not settings.openai_api_key else "openai"}