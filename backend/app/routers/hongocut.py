import os
import re
from urllib.parse import urlparse, parse_qs

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.hc_word import HcWord
from app.models.sentence import Sentence
from app.models.video import Video
from app.schemas.hongocut import (
    HcPopularWord,
    HcSearchResult,
    HcSuggestion,
    HcVideoOut,
    HcVideoSubmitRequest,
)
from app.services.romaji_service import generate_romaji
from app.services.subtitle_service import (
    download_subtitles,
    fetch_subtitle_info,
    get_video_metadata,
    parse_vtt,
)
from app.services.tokenizer_service import tokenize

router = APIRouter(prefix="/hc", tags=["hongocut"])


# ── Helpers ────────────────────────────────────────────────────────────────────

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


def _require_admin(user_id: str | None) -> None:
    if not user_id or user_id not in settings.admin_user_ids:
        raise HTTPException(status_code=403, detail="Admin access required.")


def _word_count_subq():
    return (
        select(HcWord.video_id, func.count().label("word_cnt"))
        .group_by(HcWord.video_id)
        .subquery()
    )


def _sentence_count_subq():
    return (
        select(Sentence.video_id, func.count().label("sent_cnt"))
        .group_by(Sentence.video_id)
        .subquery()
    )


# ── POST /hc/videos ────────────────────────────────────────────────────────────

@router.post("/videos", response_model=HcVideoOut)
async def submit_hc_video(
    body: HcVideoSubmitRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)
    youtube_id = _extract_youtube_id(body.youtube_url)

    # A2: Check if video already exists (from Shadowing or previous HC submission)
    existing_video = await db.scalar(select(Video).where(Video.youtube_id == youtube_id))

    if existing_video:
        video = existing_video
        # Reuse existing sentences — no need to re-download subtitles
        result = await db.execute(
            select(Sentence)
            .where(Sentence.video_id == video.id)
            .order_by(Sentence.sequence_no)
        )
        sentences = list(result.scalars().all())
    else:
        # Full pipeline: metadata + subtitles + parse + romaji
        sub_info = await fetch_subtitle_info(body.youtube_url)
        if not sub_info["has_japanese"]:
            raise HTTPException(
                status_code=422,
                detail="Video ini tidak memiliki subtitle Jepang. Coba video lain.",
            )

        metadata = await get_video_metadata(body.youtube_url)
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
            is_public=False,
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
        await db.flush()

    # Clear existing hc_words for this video (safe to re-process)
    await db.execute(delete(HcWord).where(HcWord.video_id == video.id))

    # Tokenize all sentences and bulk-insert hc_words
    hc_words: list[HcWord] = []
    for sentence in sentences:
        for token in tokenize(sentence.text_ja):
            hc_words.append(HcWord(
                sentence_id=sentence.id,
                video_id=video.id,
                surface=token["surface"],
                base_form=token["base_form"],
                reading=token["reading"],
                pos=token["pos"],
                position=token["position"],
            ))

    db.add_all(hc_words)
    await db.commit()
    await db.refresh(video)

    return HcVideoOut(
        id=video.id,
        youtube_id=video.youtube_id,
        title=video.title,
        channel=video.channel,
        word_count=len(hc_words),
        sentence_count=len(sentences),
        created_at=video.created_at,
    )


# ── GET /hc/videos ─────────────────────────────────────────────────────────────

@router.get("/videos", response_model=list[HcVideoOut])
async def list_hc_videos(
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)

    word_subq = _word_count_subq()
    sent_subq = _sentence_count_subq()

    rows = await db.execute(
        select(
            Video,
            func.coalesce(word_subq.c.word_cnt, 0).label("word_count"),
            func.coalesce(sent_subq.c.sent_cnt, 0).label("sentence_count"),
        )
        # INNER JOIN word_subq: only return videos that have hc_words (i.e. HC-processed)
        .join(word_subq, Video.id == word_subq.c.video_id)
        .outerjoin(sent_subq, Video.id == sent_subq.c.video_id)
        .order_by(Video.created_at.desc())
    )

    return [
        HcVideoOut(
            id=video.id,
            youtube_id=video.youtube_id,
            title=video.title,
            channel=video.channel,
            word_count=word_count,
            sentence_count=sentence_count,
            created_at=video.created_at,
        )
        for video, word_count, sentence_count in rows
    ]


# ── DELETE /hc/videos/{video_id} ───────────────────────────────────────────────

@router.delete("/videos/{video_id}")
async def delete_hc_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_id)

    video = await db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video tidak ditemukan.")

    await db.delete(video)
    await db.commit()
    return {"message": "Video deleted"}


# ── GET /hc/search ─────────────────────────────────────────────────────────────

@router.get("/search", response_model=list[HcSearchResult])
async def search_hc(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50, ge=1),
    skip: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(
            HcWord.id.label("word_id"),
            HcWord.surface,
            HcWord.base_form,
            HcWord.reading,
            HcWord.sentence_id,
            Sentence.text_ja,
            Sentence.text_romaji,
            Sentence.start_time,
            Sentence.end_time,
            Video.id.label("video_id"),
            Video.youtube_id,
            Video.title,
            Video.channel,
        )
        .join(Sentence, HcWord.sentence_id == Sentence.id)
        .join(Video, HcWord.video_id == Video.id)
        .where(or_(HcWord.surface == q, HcWord.base_form == q))
        .order_by(Video.created_at.desc())
        .limit(limit)
        .offset(skip)
    )

    return [
        HcSearchResult(
            word_id=row.word_id,
            surface=row.surface,
            base_form=row.base_form,
            reading=row.reading,
            sentence_id=row.sentence_id,
            text_ja=row.text_ja,
            text_romaji=row.text_romaji,
            start_time=row.start_time,
            end_time=row.end_time,
            video_id=row.video_id,
            youtube_id=row.youtube_id,
            title=row.title,
            channel=row.channel,
        )
        for row in rows
    ]


# ── GET /hc/search/suggestions ─────────────────────────────────────────────────

@router.get("/search/suggestions", response_model=list[HcSuggestion])
async def search_suggestions(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(
        select(HcWord.surface, HcWord.base_form, HcWord.reading)
        .distinct()
        .where(or_(HcWord.surface.like(f"{q}%"), HcWord.base_form.like(f"{q}%")))
        .limit(10)
    )
    return [
        HcSuggestion(surface=r.surface, base_form=r.base_form, reading=r.reading)
        for r in rows
    ]


# ── GET /hc/words/popular ──────────────────────────────────────────────────────

@router.get("/words/popular", response_model=list[HcPopularWord])
async def popular_words(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(HcWord.surface, HcWord.base_form, HcWord.reading)
        .group_by(HcWord.surface, HcWord.base_form, HcWord.reading)
        .order_by(func.count().desc())
        .limit(10)
    )
    return [
        HcPopularWord(surface=r.surface, base_form=r.base_form, reading=r.reading)
        for r in rows
    ]
