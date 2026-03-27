from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.sentence import Sentence
from app.models.user_progress import UserProgress
from app.models.video import Video
from app.schemas.progress import ProgressOut, ProgressUpdateRequest, SessionProgressOut
from app.schemas.video import VideoDetailOut

router = APIRouter(prefix="/session", tags=["session"])


# ── GET /session/{video_id} ────────────────────────────────────────────────────

@router.get("/{video_id}", response_model=VideoDetailOut)
async def get_session(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Video)
        .where(Video.id == video_id)
        .options(selectinload(Video.sentences))
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan.")

    sentences_sorted = sorted(video.sentences, key=lambda s: s.sequence_no or 0)

    return VideoDetailOut.model_validate(
        {
            **video.__dict__,
            "sentence_count": len(sentences_sorted),
            "sentences": [s.__dict__ for s in sentences_sorted],
        }
    )


# ── POST /session/{video_id}/progress ─────────────────────────────────────────

@router.post("/{video_id}/progress", response_model=ProgressOut)
async def upsert_progress(
    video_id: int,
    body: ProgressUpdateRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    # UPSERT: update if exists, insert if not
    existing = await db.scalar(
        select(UserProgress).where(
            UserProgress.user_id == x_user_id,
            UserProgress.video_id == video_id,
            UserProgress.sentence_id == body.sentence_id,
        )
    )

    if existing:
        existing.replays = body.replays
        existing.completed = body.completed
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        progress = UserProgress(
            user_id=x_user_id,
            video_id=video_id,
            sentence_id=body.sentence_id,
            replays=body.replays,
            completed=body.completed,
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
        return progress


# ── GET /session/{video_id}/progress ──────────────────────────────────────────

@router.get("/{video_id}/progress", response_model=SessionProgressOut)
async def get_progress(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    # Total sentence count for this video
    total = await db.scalar(
        select(Sentence).where(Sentence.video_id == video_id).with_only_columns(
            __import__("sqlalchemy").func.count()
        )
    ) or 0

    # All progress rows for this user+video
    rows = (
        await db.execute(
            select(UserProgress)
            .where(
                UserProgress.user_id == x_user_id,
                UserProgress.video_id == video_id,
            )
        )
    ).scalars().all()

    completed_count = sum(1 for r in rows if r.completed)

    # Resume point: first incomplete sentence by sequence_no
    # We need the sentence with the smallest sequence_no where completed=False.
    # Get IDs of completed sentences.
    completed_ids = {r.sentence_id for r in rows if r.completed}

    # Find first sentence not yet completed
    first_incomplete = await db.scalar(
        select(Sentence)
        .where(
            Sentence.video_id == video_id,
            Sentence.id.not_in(completed_ids) if completed_ids else True,
        )
        .order_by(Sentence.sequence_no)
        .limit(1)
    )
    last_sentence_id = first_incomplete.id if first_incomplete else None

    return SessionProgressOut(
        video_id=video_id,
        last_sentence_id=last_sentence_id,
        completed_count=completed_count,
        total_sentences=total,
        sentences=[
            ProgressOut(
                sentence_id=r.sentence_id,
                replays=r.replays,
                completed=r.completed,
                created_at=r.created_at,
            )
            for r in rows
        ],
    )
