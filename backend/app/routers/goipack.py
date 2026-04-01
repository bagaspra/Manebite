"""
GoiPack router — vocabulary packs organised by topic/niche.

Public endpoints: list categories, list packs, get pack detail (with JLPT sorting).
Admin endpoints: CRUD for categories and packs, Gemini word generation.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.goi_category import GoiCategory
from app.models.goi_pack import GoiPack
from app.models.goi_word import GoiWord
from app.models.user import User
from app.schemas.goipack import (
    CategoryCreate, CategoryUpdate, CategoryOut, CategoryWithCount,
    PackCreate, PackUpdate, PackOut, PackAdminOut, PackAdminDetailOut,
    PackDetailOut, WordOut, GenerateWordsResponse, WordInput,
)
from app.services.goipack_service import generate_pack_words, generate_ruby_for_sentences

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gp", tags=["goipack"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_admin(user_id: str | None) -> None:
    if not user_id or user_id not in settings.admin_user_ids:
        raise HTTPException(status_code=403, detail="Admin access required.")


def _jlpt_sort_order(user_level: int | None) -> list[int]:
    """Return JLPT levels in display order based on user level."""
    all_levels = [5, 4, 3, 2, 1]
    if user_level is None:
        return all_levels
    order = [user_level]
    order.extend(sorted([l for l in all_levels if l > user_level], reverse=True))
    order.extend(sorted([l for l in all_levels if l < user_level], reverse=True))
    return order


def _sort_words(words: list[GoiWord], user_level: int | None) -> list[GoiWord]:
    level_priority = {lvl: i for i, lvl in enumerate(_jlpt_sort_order(user_level))}
    return sorted(words, key=lambda w: (level_priority.get(w.jlpt_level, 99), w.sort_order))


def _word_to_out(w: GoiWord) -> WordOut:
    return WordOut(
        id=w.id,
        surface=w.surface,
        reading=w.reading,
        jlpt_level=w.jlpt_level,
        meaning_en=w.meaning_en,
        meaning_id=w.meaning_id,
        examples_ja=w.examples_ja or [],
        examples_ja_ruby=w.examples_ja_ruby or None,
        examples_en=w.examples_en or [],
        examples_id=w.examples_id or [],
        sort_order=w.sort_order,
    )


def _pack_to_out(p: GoiPack) -> PackOut:
    return PackOut(
        id=p.id,
        category_id=p.category_id,
        name_ja=p.name_ja,
        name_en=p.name_en,
        name_id=p.name_id,
        description=p.description,
        word_count=p.word_count or 0,
        is_published=p.is_published or False,
        created_at=p.created_at.isoformat() if p.created_at else None,
    )


# ── Public: Categories ────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryWithCount])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """All categories with count of published packs."""
    cats = (
        await db.execute(select(GoiCategory).order_by(GoiCategory.sort_order, GoiCategory.id))
    ).scalars().all()

    result = []
    for cat in cats:
        count = await db.scalar(
            select(func.count(GoiPack.id)).where(
                GoiPack.category_id == cat.id,
                GoiPack.is_published == True,  # noqa: E712
            )
        )
        result.append(CategoryWithCount(
            id=cat.id,
            name_ja=cat.name_ja,
            name_en=cat.name_en,
            name_id=cat.name_id,
            icon=cat.icon or "📚",
            sort_order=cat.sort_order or 0,
            pack_count=count or 0,
        ))
    return result


@router.get("/categories/{category_id}/packs", response_model=list[PackOut])
async def list_packs_in_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Published packs within a category."""
    cat = await db.scalar(select(GoiCategory).where(GoiCategory.id == category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    packs = (
        await db.execute(
            select(GoiPack).where(
                GoiPack.category_id == category_id,
                GoiPack.is_published == True,  # noqa: E712
            ).order_by(GoiPack.id)
        )
    ).scalars().all()

    return [_pack_to_out(p) for p in packs]


# ── Public: Pack detail ───────────────────────────────────────────────────────

@router.get("/packs/{pack_id}", response_model=PackDetailOut)
async def get_pack_detail(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    """Pack detail with all words sorted by user's JLPT level."""
    pack = await db.scalar(
        select(GoiPack).where(GoiPack.id == pack_id, GoiPack.is_published == True)  # noqa: E712
    )
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found.")

    # Get user JLPT level for sorting
    user_level: int | None = None
    if x_user_id:
        user = await db.scalar(select(User).where(User.id == x_user_id))
        if user:
            user_level = user.jlpt_level

    words = (
        await db.execute(select(GoiWord).where(GoiWord.pack_id == pack_id))
    ).scalars().all()

    sorted_words = _sort_words(list(words), user_level)

    return PackDetailOut(
        pack=_pack_to_out(pack),
        words=[_word_to_out(w) for w in sorted_words],
    )


# ── Admin: Categories ─────────────────────────────────────────────────────────

@router.get("/admin/categories", response_model=list[CategoryOut])
async def admin_list_categories(
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    cats = (
        await db.execute(select(GoiCategory).order_by(GoiCategory.sort_order, GoiCategory.id))
    ).scalars().all()
    return [CategoryOut.model_validate(c) for c in cats]


@router.post("/admin/categories", response_model=CategoryOut, status_code=201)
async def admin_create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    cat = GoiCategory(**body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.put("/admin/categories/{category_id}", response_model=CategoryOut)
async def admin_update_category(
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    cat = await db.scalar(select(GoiCategory).where(GoiCategory.id == category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    for k, v in body.model_dump().items():
        setattr(cat, k, v)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.delete("/admin/categories/{category_id}", status_code=204)
async def admin_delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    cat = await db.scalar(select(GoiCategory).where(GoiCategory.id == category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    await db.delete(cat)
    await db.commit()


# ── Admin: Packs ──────────────────────────────────────────────────────────────

@router.get("/admin/packs", response_model=list[PackAdminOut])
async def admin_list_packs(
    category_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    q = select(GoiPack, GoiCategory).join(GoiCategory, GoiPack.category_id == GoiCategory.id)
    if category_id is not None:
        q = q.where(GoiPack.category_id == category_id)
    q = q.order_by(GoiPack.category_id, GoiPack.id)
    rows = (await db.execute(q)).all()

    return [
        PackAdminOut(
            **_pack_to_out(pack).model_dump(),
            category_name_ja=cat.name_ja,
            category_name_en=cat.name_en,
        )
        for pack, cat in rows
    ]


@router.get("/admin/packs/{pack_id}", response_model=PackAdminDetailOut)
async def admin_get_pack(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    row = (
        await db.execute(
            select(GoiPack, GoiCategory)
            .join(GoiCategory, GoiPack.category_id == GoiCategory.id)
            .where(GoiPack.id == pack_id)
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Pack not found.")
    pack, cat = row

    words = (
        await db.execute(select(GoiWord).where(GoiWord.pack_id == pack_id).order_by(GoiWord.sort_order))
    ).scalars().all()

    return PackAdminDetailOut(
        pack=PackAdminOut(
            **_pack_to_out(pack).model_dump(),
            category_name_ja=cat.name_ja,
            category_name_en=cat.name_en,
        ),
        words=[_word_to_out(w) for w in words],
    )


@router.post("/admin/packs", response_model=PackOut, status_code=201)
async def admin_create_pack(
    body: PackCreate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    cat = await db.scalar(select(GoiCategory).where(GoiCategory.id == body.category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    pack = GoiPack(**body.model_dump(), created_by=x_user_id)
    db.add(pack)
    await db.commit()
    await db.refresh(pack)
    return _pack_to_out(pack)


@router.post("/admin/packs/{pack_id}/generate", response_model=GenerateWordsResponse)
async def admin_generate_words(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    """Generate vocabulary via Gemini — returns preview, does NOT save."""
    _require_admin(x_user_id)
    row = (
        await db.execute(
            select(GoiPack, GoiCategory)
            .join(GoiCategory, GoiPack.category_id == GoiCategory.id)
            .where(GoiPack.id == pack_id)
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Pack not found.")
    pack, cat = row

    try:
        words = await generate_pack_words(
            pack_name_ja=pack.name_ja,
            pack_name_en=pack.name_en,
            pack_description=pack.description or "",
            category_name_en=cat.name_en,
        )
    except RuntimeError as e:
        if "quota_exceeded" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait and try again.")
        raise HTTPException(status_code=500, detail="Word generation failed.")
    except Exception as e:
        logger.error("GoiPack generate error: %s", e)
        raise HTTPException(status_code=500, detail="Word generation failed.")

    return GenerateWordsResponse(words=[WordInput(**w) for w in words])


@router.post("/admin/packs/{pack_id}/generate-ruby", response_model=PackOut)
async def admin_generate_ruby(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    """Generate furigana ruby annotations for all existing words in a pack."""
    _require_admin(x_user_id)
    pack = await db.scalar(select(GoiPack).where(GoiPack.id == pack_id))
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found.")

    words = (
        await db.execute(select(GoiWord).where(GoiWord.pack_id == pack_id).order_by(GoiWord.sort_order))
    ).scalars().all()

    if not words:
        return _pack_to_out(pack)

    # Collect all plain sentences in order: [w0e0, w0e1, w0e2, w1e0, ...]
    all_sentences: list[str] = []
    for w in words:
        all_sentences.extend(w.examples_ja or ["", "", ""])

    try:
        all_ruby = await generate_ruby_for_sentences(all_sentences)
    except RuntimeError as e:
        if "quota_exceeded" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded.")
        raise HTTPException(status_code=500, detail="Ruby generation failed.")
    except Exception as e:
        logger.error("generate-ruby error: %s", e)
        raise HTTPException(status_code=500, detail="Ruby generation failed.")

    # Write back: 3 ruby sentences per word
    for i, word in enumerate(words):
        start = i * 3
        word.examples_ja_ruby = all_ruby[start : start + 3]

    await db.commit()
    await db.refresh(pack)
    return _pack_to_out(pack)


@router.put("/admin/packs/{pack_id}", response_model=PackOut)
async def admin_update_pack(
    pack_id: int,
    body: PackUpdate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    """Update pack metadata and replace all words."""
    _require_admin(x_user_id)
    pack = await db.scalar(select(GoiPack).where(GoiPack.id == pack_id))
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found.")

    # Update metadata
    pack.name_ja = body.name_ja
    pack.name_en = body.name_en
    pack.name_id = body.name_id
    pack.description = body.description

    # Replace all words
    await db.execute(delete(GoiWord).where(GoiWord.pack_id == pack_id))
    for word_in in body.words:
        db.add(GoiWord(pack_id=pack_id, **word_in.model_dump(exclude_none=False)))

    # Update word_count if published
    if pack.is_published:
        pack.word_count = len(body.words)

    await db.commit()
    await db.refresh(pack)
    return _pack_to_out(pack)


@router.post("/admin/packs/{pack_id}/publish", response_model=PackOut)
async def admin_publish_pack(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    pack = await db.scalar(select(GoiPack).where(GoiPack.id == pack_id))
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found.")

    word_count = await db.scalar(
        select(func.count(GoiWord.id)).where(GoiWord.pack_id == pack_id)
    )
    pack.is_published = True
    pack.word_count = word_count or 0
    await db.commit()
    await db.refresh(pack)
    return _pack_to_out(pack)


@router.delete("/admin/packs/{pack_id}", status_code=204)
async def admin_delete_pack(
    pack_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    pack = await db.scalar(select(GoiPack).where(GoiPack.id == pack_id))
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found.")
    await db.delete(pack)
    await db.commit()
