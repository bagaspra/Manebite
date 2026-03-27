import os
import re
from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlparse, parse_qs

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.sentence import Sentence
from app.models.video import Video
from app.schemas.video import (
    VideoDetailOut,
    VideoOut,
    VideoSubmitRequest,
    VideoSubmitResponse,
)
from app.services.romaji_service import generate_romaji
from app.services.subtitle_service import (
    download_subtitles,
    fetch_subtitle_info,
    get_video_metadata,
    parse_vtt,
)

router = APIRouter(prefix="/videos", tags=["videos"])


def _extract_youtube_id(url: str) -> str:
    short = re.match(r"youtu\.be/([A-Za-z0-9_-]{11})", url)
    if short:
        return short.group(1)
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    if "v" in qs:
        return qs["v"][0]
    path_match = re.search(r"/(?:embed|shorts)/([A-Za-z0-9_-]{11})", parsed.path)
    if path_match:
        return path_match.group(1)
    raise HTTPException(status_code=422, detail="Tidak bisa mengekstrak YouTube ID dari URL ini.")


def _sentence_count_subq():
    return (
        select(Sentence.video_id, func.count().label("cnt"))
        .group_by(Sentence.video_id)
        .subquery()
    )


# ── POST /videos ───────────────────────────────────────────────────────────────

@router.post("", response_model=VideoSubmitResponse)
async def submit_video(
    body: VideoSubmitRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    youtube_id = _extract_youtube_id(body.youtube_url)

    # Rate limit: max 10 per user per day
    if x_user_id:
        since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
        daily_count = await db.scalar(
            select(func.count()).where(
                Video.submitted_by == x_user_id,
                Video.created_at >= since,
            )
        )
        if (daily_count or 0) >= 10:
            raise HTTPException(status_code=429, detail="Daily submission limit reached (10/day).")

    # Duplicate check
    existing = await db.scalar(select(Video).where(Video.youtube_id == youtube_id))
    if existing:
        count = await db.scalar(select(func.count()).where(Sentence.video_id == existing.id))
        video_out = VideoOut.model_validate({**existing.__dict__, "sentence_count": count or 0})
        return VideoSubmitResponse(video=video_out, sentences_count=count or 0, message="Video sudah ada di database.")

    metadata = await get_video_metadata(body.youtube_url)
    sub_info = await fetch_subtitle_info(body.youtube_url)
    if not sub_info["has_japanese"]:
        raise HTTPException(status_code=422, detail="Video ini tidak memiliki subtitle Jepang. Coba video lain.")

    vtt_path = await download_subtitles(body.youtube_url, youtube_id)
    cues = parse_vtt(vtt_path)
    try:
        os.remove(vtt_path)
    except OSError:
        pass

    video = Video(
        youtube_id=youtube_id,
        title=metadata.get("title"),
        channel=metadata.get("channel"),
        language="ja",
        submitted_by=x_user_id,
        is_public=False,  # default private
    )
    db.add(video)
    await db.flush()

    sentences = []
    for i, cue in enumerate(cues, start=1):
        sentences.append(Sentence(
            video_id=video.id,
            sequence_no=i,
            text_ja=cue["text"],
            text_romaji=generate_romaji(cue["text"]),
            start_time=cue["start_time"],
            end_time=cue["end_time"],
            duration=cue["duration"],
        ))
    db.add_all(sentences)
    await db.commit()
    await db.refresh(video)

    video_out = VideoOut.model_validate({**video.__dict__, "sentence_count": len(sentences)})
    return VideoSubmitResponse(
        video=video_out,
        sentences_count=len(sentences),
        message=f"Video berhasil ditambahkan dengan {len(sentences)} kalimat.",
    )


# ── GET /videos ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[VideoOut])
async def list_videos(
    skip: int = 0,
    limit: int = 20,
    filter: Literal["mine", "public", "all"] = "public",
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    count_subq = _sentence_count_subq()
    base = (
        select(Video, func.coalesce(count_subq.c.cnt, 0).label("sentence_count"))
        .outerjoin(count_subq, Video.id == count_subq.c.video_id)
    )

    if filter == "public":
        base = base.where(Video.is_public == True)  # noqa: E712
    elif filter == "mine":
        if not x_user_id:
            raise HTTPException(status_code=401, detail="Authentication required for 'mine' filter.")
        base = base.where(Video.submitted_by == x_user_id)
    else:  # "all" — mine + public, deduplicated
        if not x_user_id:
            base = base.where(Video.is_public == True)  # noqa: E712
        else:
            base = base.where(
                or_(Video.is_public == True, Video.submitted_by == x_user_id)  # noqa: E712
            )

    rows = await db.execute(base.offset(skip).limit(limit))
    return [
        VideoOut.model_validate({**video.__dict__, "sentence_count": sc})
        for video, sc in rows
    ]


# ── GET /videos/{video_id} ─────────────────────────────────────────────────────

@router.get("/{video_id}", response_model=VideoDetailOut)
async def get_video(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Video).where(Video.id == video_id).options(selectinload(Video.sentences))
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan.")

    sentences_sorted = sorted(video.sentences, key=lambda s: s.sequence_no or 0)
    return VideoDetailOut.model_validate({
        **video.__dict__,
        "sentence_count": len(sentences_sorted),
        "sentences": [s.__dict__ for s in sentences_sorted],
    })


# ── PATCH /videos/{video_id}/visibility ───────────────────────────────────────

@router.patch("/{video_id}/visibility", response_model=VideoOut)
async def toggle_visibility(
    video_id: int,
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan.")
    if video.submitted_by != x_user_id:
        raise HTTPException(status_code=403, detail="You do not own this video.")

    video.is_public = bool(body.get("is_public", False))
    await db.commit()
    await db.refresh(video)

    count = await db.scalar(select(func.count()).where(Sentence.video_id == video.id))
    return VideoOut.model_validate({**video.__dict__, "sentence_count": count or 0})


# ── DELETE /videos/{video_id} ─────────────────────────────────────────────────

@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan.")

    # Only the submitter (or un-owned videos) can be deleted
    if video.submitted_by is not None and video.submitted_by != x_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this video.")

    await db.delete(video)
    await db.commit()
    return {"message": "Video deleted"}
