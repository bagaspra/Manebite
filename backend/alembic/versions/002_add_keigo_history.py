"""Add keigo_history table

Revision ID: 002
Revises: 001
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "keigo_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("input_mode", sa.Text(), nullable=False),
        sa.Column("output_ja", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("levels_used", ARRAY(sa.Text()), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True, server_default=sa.text("NOW()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_keigo_history_user",
        "keigo_history",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_keigo_history_user", table_name="keigo_history")
    op.drop_table("keigo_history")
