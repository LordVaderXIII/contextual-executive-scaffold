from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ContextCreate(BaseModel):
    name: str
    slug: str
    location_rules: dict[str, Any] | None = None
    default_priorities: dict[str, Any] | None = None
    accent_hue: int = 182
    is_active: bool = True


class ContextUpdate(BaseModel):
    name: str | None = None
    location_rules: dict[str, Any] | None = None
    default_priorities: dict[str, Any] | None = None
    accent_hue: int | None = None
    is_active: bool | None = None


class TaskCreate(BaseModel):
    description: str
    context_id: int
    is_preferred: bool = False
    status: str = "pending"
    due_at: datetime | None = None
    sort_order: int = 0


class TaskUpdate(BaseModel):
    description: str | None = None
    context_id: int | None = None
    is_preferred: bool | None = None
    status: str | None = None
    due_at: datetime | None = None
    ai_decomposition: dict[str, Any] | None = None
    implementation_intention: str | None = None
    sort_order: int | None = None


class FocusSessionCreate(BaseModel):
    task_id: int | None = None
    session_type: str = "normal"
    planned_minutes: int | None = None
    end_condition: str | None = None
    notes: str | None = None


class FocusSessionEnd(BaseModel):
    ended_at: datetime | None = None
    notes: str | None = None
    reflection: dict[str, str] | None = None


class NudgeRuleCreate(BaseModel):
    name: str
    context_id: int | None = None
    cron_or_ha_trigger: str | None = None
    conditions: dict[str, Any] | None = None
    intensity: str = "gentle"
    enabled: bool = True


class NudgeRuleUpdate(BaseModel):
    name: str | None = None
    context_id: int | None = None
    cron_or_ha_trigger: str | None = None
    conditions: dict[str, Any] | None = None
    intensity: str | None = None
    enabled: bool | None = None


class AIDecomposeRequest(BaseModel):
    task_id: int | None = None
    description: str | None = None
    paste_response: dict[str, Any] | None = None


class AIPlanDayRequest(BaseModel):
    date: str | None = None


class HAExecuteRequest(BaseModel):
    domain: str
    service: str
    data: dict[str, Any] = Field(default_factory=dict)


class HAWebhookPayload(BaseModel):
    action: str
    nudge_id: int | None = None
    metadata: dict[str, Any] | None = None


class ContextOverride(BaseModel):
    slug: str | None = None


class PauseMode(BaseModel):
    enabled: bool