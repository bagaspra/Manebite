"""
Keigo Translator router.

Authentication: Uses the same X-User-Id header pattern as all other endpoints in this
codebase (videos.py, session.py). The header value is trusted as-is.

TODO (before production): Replace X-User-Id with proper JWT validation so that only
the authenticated user can read/write their own history. The current pattern assumes a
trusted internal network where the frontend is the only caller.
"""

import json
import logging
import os

from google import genai
from google.genai import types
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.keigo_history import KeigoHistory

logger = logging.getLogger(__name__)

router = APIRouter(tags=["keigo"])

# ── Gemini setup ───────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """\
You are a Japanese keigo (formal language) expert.
Your task is to convert the given input into appropriate Japanese keigo.

Rules:
- If input_mode is "en", the input is in English or Indonesian. Translate it to Japanese keigo directly.
- If input_mode is "ja", the input is casual Japanese. Convert it to keigo.
- Always use natural, business-appropriate Japanese.
- Identify which keigo levels you used: teineigo (丁寧語), sonkeigo (尊敬語), kenjougo (謙譲語).
- Write a brief explanation in English of the key word choices (max 2 sentences).

Respond ONLY in this JSON format, no markdown, no extra text:
{
  "output_ja": "...",
  "explanation": "...",
  "levels_used": ["teineigo", "kenjougo"]
}"""


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Keigo service not configured")
    return genai.Client(api_key=GEMINI_API_KEY)


def _parse_gemini_response(text: str) -> dict:
    """Strip markdown fences if present and parse JSON."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Remove first and last fence lines
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


# ── Schemas ────────────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    input_mode: str = "en"  # "en" | "ja"
    target_level: str = "business"  # "business" | "polite" | "very_formal"


class HistoryImportItem(BaseModel):
    input_text: str
    input_mode: str
    output_ja: str
    explanation: str | None = None
    levels_used: list[str] = []


class HistoryImportRequest(BaseModel):
    items: list[HistoryImportItem]


# ── POST /keigo/translate ──────────────────────────────────────────────────────

@router.post("/translate")
async def translate(
    body: TranslateRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if len(body.text.strip()) < 3:
        raise HTTPException(status_code=422, detail="Input too short (minimum 3 characters)")

    client = _get_client()
    prompt = (
        f"input_mode: {body.input_mode}\n"
        f"target_level: {body.target_level}\n"
        f"input: {body.text.strip()}"
    )

    parsed: dict | None = None
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
                config=types.GenerateContentConfig(temperature=0.3),
            )
            parsed = _parse_gemini_response(response.text)
            break
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Gemini response parse error (attempt %d): %s", attempt + 1, e)
            if attempt == 1:
                raise HTTPException(status_code=500, detail="Translation service returned an unexpected response")
        except Exception as e:
            error_str = str(e)
            logger.error("Gemini API error: %s", error_str)
            if "quota" in error_str.lower() or "resource_exhausted" in error_str.lower() or "429" in error_str:
                raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait a moment and try again.")
            raise HTTPException(status_code=500, detail="Translation service unavailable")

    if parsed is None:
        raise HTTPException(status_code=500, detail="Translation service returned an unexpected response")

    # Save to DB if user is logged in
    if x_user_id:
        db.add(KeigoHistory(
            user_id=x_user_id,
            input_text=body.text.strip(),
            input_mode=body.input_mode,
            output_ja=parsed.get("output_ja", ""),
            explanation=parsed.get("explanation"),
            levels_used=parsed.get("levels_used", []),
        ))
        await db.commit()

    return {
        "output_ja": parsed.get("output_ja", ""),
        "explanation": parsed.get("explanation", ""),
        "levels_used": parsed.get("levels_used", []),
        "input_mode": body.input_mode,
    }


# ── GET /keigo/history ─────────────────────────────────────────────────────────

@router.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    rows = (
        await db.execute(
            select(KeigoHistory)
            .where(KeigoHistory.user_id == x_user_id)
            .order_by(KeigoHistory.created_at.desc())
            .limit(10)
        )
    ).scalars().all()

    return [
        {
            "id": r.id,
            "input_text": r.input_text,
            "input_mode": r.input_mode,
            "output_ja": r.output_ja,
            "explanation": r.explanation,
            "levels_used": r.levels_used or [],
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# ── DELETE /keigo/history/{item_id} ───────────────────────────────────────────

@router.delete("/history/{item_id}")
async def delete_history_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    row = await db.scalar(
        select(KeigoHistory).where(
            KeigoHistory.id == item_id,
            KeigoHistory.user_id == x_user_id,
        )
    )
    if not row:
        raise HTTPException(status_code=404, detail="History item not found")

    await db.delete(row)
    await db.commit()
    return {"message": "Deleted"}


# ── POST /keigo/history/import ─────────────────────────────────────────────────

@router.post("/history/import")
async def import_history(
    body: HistoryImportRequest,
    db: AsyncSession = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    """Merge guest localStorage history into DB on first login."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    for item in body.items:
        db.add(KeigoHistory(
            user_id=x_user_id,
            input_text=item.input_text,
            input_mode=item.input_mode,
            output_ja=item.output_ja,
            explanation=item.explanation,
            levels_used=item.levels_used,
        ))

    await db.commit()
    return {"message": f"Imported {len(body.items)} items"}
