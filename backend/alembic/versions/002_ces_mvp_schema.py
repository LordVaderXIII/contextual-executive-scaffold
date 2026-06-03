"""CES MVP schema extensions.

Revision ID: 002
Revises: 001
Create Date: 2026-06-03

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("contexts", sa.Column("location_rules", sa.JSON(), nullable=True))
    op.add_column("contexts", sa.Column("default_priorities", sa.JSON(), nullable=True))
    op.add_column(
        "contexts",
        sa.Column("accent_hue", sa.Integer(), nullable=False, server_default="182"),
    )
    op.add_column("tasks", sa.Column("due_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tasks", sa.Column("ai_decomposition", sa.JSON(), nullable=True))
    op.add_column("tasks", sa.Column("implementation_intention", sa.Text(), nullable=True))
    op.add_column(
        "tasks",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "focus_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("session_type", sa.String(length=32), nullable=False),
        sa.Column("end_condition", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "nudge_rules",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("context_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("cron_or_ha_trigger", sa.String(length=200), nullable=True),
        sa.Column("conditions", sa.JSON(), nullable=True),
        sa.Column("intensity", sa.String(length=32), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["context_id"], ["contexts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "nudges",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("rule_id", sa.Integer(), nullable=True),
        sa.Column("context_id", sa.Integer(), nullable=True),
        sa.Column("fired_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("nudge_type", sa.String(length=64), nullable=False),
        sa.Column("user_response", sa.String(length=64), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["context_id"], ["contexts.id"]),
        sa.ForeignKeyConstraint(["rule_id"], ["nudge_rules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ai_interactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("prompt_type", sa.String(length=64), nullable=False),
        sa.Column("input_hash", sa.String(length=64), nullable=False),
        sa.Column("input_summary", sa.Text(), nullable=True),
        sa.Column("output_summary", sa.Text(), nullable=True),
        sa.Column("full_response", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_interactions_input_hash", "ai_interactions", ["input_hash"])
    op.create_table(
        "reflection_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=True),
        sa.Column("logged_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("worked", sa.Text(), nullable=True),
        sa.Column("blocked", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["focus_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
    op.drop_table("reflection_logs")
    op.drop_index("ix_ai_interactions_input_hash", table_name="ai_interactions")
    op.drop_table("ai_interactions")
    op.drop_table("nudges")
    op.drop_table("nudge_rules")
    op.drop_table("focus_sessions")
    op.drop_column("tasks", "sort_order")
    op.drop_column("tasks", "implementation_intention")
    op.drop_column("tasks", "ai_decomposition")
    op.drop_column("tasks", "due_at")
    op.drop_column("contexts", "accent_hue")
    op.drop_column("contexts", "default_priorities")
    op.drop_column("contexts", "location_rules")