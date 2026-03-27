"""Initial schema: videos, sentences, user_progress

Revision ID: 001
Revises:
Create Date: 2026-03-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "videos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("youtube_id", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("channel", sa.Text(), nullable=True),
        sa.Column("language", sa.Text(), nullable=True, server_default="ja"),
        sa.Column("difficulty", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("submitted_by", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True, server_default=sa.text("NOW()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("youtube_id"),
    )

    op.create_table(
        "sentences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("video_id", sa.Integer(), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=True),
        sa.Column("text_ja", sa.Text(), nullable=False),
        sa.Column("text_romaji", sa.Text(), nullable=True),
        sa.Column("text_en", sa.Text(), nullable=True),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("video_id", sa.Integer(), nullable=False),
        sa.Column("sentence_id", sa.Integer(), nullable=False),
        sa.Column("replays", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("completed", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"]),
        sa.ForeignKeyConstraint(["sentence_id"], ["sentences.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("sentences")
    op.drop_table("videos")
