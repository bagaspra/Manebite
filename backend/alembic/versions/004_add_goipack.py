"""Add GoiPack tables and jlpt_level on users

Revision ID: 004
Revises: 003
Create Date: 2026-03-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add jlpt_level to users
    op.add_column("users", sa.Column("jlpt_level", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "chk_users_jlpt_level",
        "users",
        "jlpt_level IS NULL OR (jlpt_level >= 1 AND jlpt_level <= 5)",
    )

    # goi_categories
    op.create_table(
        "goi_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name_ja", sa.Text(), nullable=False),
        sa.Column("name_en", sa.Text(), nullable=False),
        sa.Column("name_id", sa.Text(), nullable=False),
        sa.Column("icon", sa.Text(), server_default="📚"),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )

    # goi_packs
    op.create_table(
        "goi_packs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("goi_categories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name_ja", sa.Text(), nullable=False),
        sa.Column("name_en", sa.Text(), nullable=False),
        sa.Column("name_id", sa.Text(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("word_count", sa.Integer(), server_default="0"),
        sa.Column("is_published", sa.Boolean(), server_default="false"),
        sa.Column("created_by", sa.Text()),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )
    op.create_index("idx_goi_packs_category", "goi_packs", ["category_id"])

    # goi_words
    op.create_table(
        "goi_words",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "pack_id",
            sa.Integer(),
            sa.ForeignKey("goi_packs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("surface", sa.Text(), nullable=False),
        sa.Column("reading", sa.Text(), nullable=False),
        sa.Column("jlpt_level", sa.Integer(), nullable=False),
        sa.Column("meaning_en", sa.Text(), nullable=False),
        sa.Column("meaning_id", sa.Text(), nullable=False),
        sa.Column("examples_ja", JSONB(), nullable=False),
        sa.Column("examples_en", JSONB(), nullable=False),
        sa.Column("examples_id", JSONB(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )
    op.create_index("idx_goi_words_pack", "goi_words", ["pack_id"])
    op.create_index("idx_goi_words_surface", "goi_words", ["surface"])
    op.create_index("idx_goi_words_jlpt", "goi_words", ["jlpt_level"])


def downgrade() -> None:
    op.drop_index("idx_goi_words_jlpt", table_name="goi_words")
    op.drop_index("idx_goi_words_surface", table_name="goi_words")
    op.drop_index("idx_goi_words_pack", table_name="goi_words")
    op.drop_table("goi_words")

    op.drop_index("idx_goi_packs_category", table_name="goi_packs")
    op.drop_table("goi_packs")

    op.drop_table("goi_categories")

    op.drop_constraint("chk_users_jlpt_level", "users", type_="check")
    op.drop_column("users", "jlpt_level")
