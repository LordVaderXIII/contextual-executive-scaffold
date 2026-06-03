from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Context(Base):
    __tablename__ = "contexts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    location_rules: Mapped[dict] = mapped_column(JSON, nullable=True)
    default_priorities: Mapped[dict] = mapped_column(JSON, nullable=True)
    accent_hue: Mapped[int] = mapped_column(Integer, default=182, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tasks: Mapped[list["Task"]] = relationship(back_populates="context")
    nudge_rules: Mapped[list["NudgeRule"]] = relationship(back_populates="context")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    context_id: Mapped[int] = mapped_column(ForeignKey("contexts.id"), nullable=False)
    is_preferred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    ai_decomposition: Mapped[dict] = mapped_column(JSON, nullable=True)
    implementation_intention: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    context: Mapped[Context] = relationship(back_populates="tasks")
    focus_sessions: Mapped[list["FocusSession"]] = relationship(back_populates="task")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    session_type: Mapped[str] = mapped_column(String(32), default="normal", nullable=False)
    planned_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_condition: Mapped[str] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    task: Mapped["Task"] = relationship(back_populates="focus_sessions")
    reflections: Mapped[list["ReflectionLog"]] = relationship(back_populates="session")


class NudgeRule(Base):
    __tablename__ = "nudge_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    context_id: Mapped[int] = mapped_column(ForeignKey("contexts.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    cron_or_ha_trigger: Mapped[str] = mapped_column(String(200), nullable=True)
    conditions: Mapped[dict] = mapped_column(JSON, nullable=True)
    intensity: Mapped[str] = mapped_column(String(32), default="gentle", nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    context: Mapped["Context"] = relationship(back_populates="nudge_rules")
    nudges: Mapped[list["Nudge"]] = relationship(back_populates="rule")


class Nudge(Base):
    __tablename__ = "nudges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rule_id: Mapped[int] = mapped_column(ForeignKey("nudge_rules.id"), nullable=True)
    context_id: Mapped[int] = mapped_column(ForeignKey("contexts.id"), nullable=True)
    fired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    nudge_type: Mapped[str] = mapped_column(String(64), default="scheduled", nullable=False)
    user_response: Mapped[str] = mapped_column(String(64), nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=True)

    rule: Mapped["NudgeRule"] = relationship(back_populates="nudges")


class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    prompt_type: Mapped[str] = mapped_column(String(64), nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    input_summary: Mapped[str] = mapped_column(Text, nullable=True)
    output_summary: Mapped[str] = mapped_column(Text, nullable=True)
    full_response: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ReflectionLog(Base):
    __tablename__ = "reflection_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("focus_sessions.id"), nullable=True)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    worked: Mapped[str] = mapped_column(Text, nullable=True)
    blocked: Mapped[str] = mapped_column(Text, nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=True)

    session: Mapped["FocusSession"] = relationship(back_populates="reflections")


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=True)