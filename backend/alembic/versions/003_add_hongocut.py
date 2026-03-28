"""Add HongoCut words table

Revision ID: 003
Revises: 002
Create Date: 2026-03-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hc_words",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "sentence_id",
            sa.Integer(),
            sa.ForeignKey("sentences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "video_id",
            sa.Integer(),
            sa.ForeignKey("videos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("surface", sa.Text(), nullable=False),
        sa.Column("base_form", sa.Text()),
        sa.Column("reading", sa.Text()),
        sa.Column("pos", sa.Text()),
        sa.Column("position", sa.Integer()),
    )
    op.create_index("idx_hc_words_surface", "hc_words", ["surface"])
    op.create_index("idx_hc_words_base_form", "hc_words", ["base_form"])


def downgrade() -> None:
    op.drop_index("idx_hc_words_base_form", table_name="hc_words")
    op.drop_index("idx_hc_words_surface", table_name="hc_words")
    op.drop_table("hc_words")
