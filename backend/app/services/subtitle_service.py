import asyncio
import glob
import os
import re
import subprocess

from fastapi import HTTPException


COOKIES_PATH = "/app/youtube_cookies.txt"


def _yt_dlp_base_args() -> list[str]:
    """Base yt-dlp args — cookies + Node.js runtime + EJS for YouTube JS challenge."""
    return [
        "--cookies", COOKIES_PATH,
        "--remote-components", "ejs:github",
        "--js-runtimes", "node",
    ]


async def fetch_subtitle_info(youtube_url: str) -> dict:
    """
    Run yt-dlp --list-subs to check if the video has Japanese subtitles.
    Returns {"has_japanese": bool, "subtitle_type": "manual"|"auto"|None}
    """
    proc = await asyncio.create_subprocess_exec(
        "yt-dlp", *_yt_dlp_base_args(), "--list-subs", "--no-download", youtube_url,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    output = stdout.decode("utf-8", errors="replace")

    # yt-dlp output lists manual subs then auto-generated subs.
    # Manual subs appear before the "Automatic captions" header line.
    auto_marker = output.find("Automatic captions")
    manual_section = output[:auto_marker] if auto_marker != -1 else output
    auto_section = output[auto_marker:] if auto_marker != -1 else ""

    # A line has a subtitle if it starts with "ja" (language code column)
    manual_has_ja = bool(re.search(r"^\s*ja\b", manual_section, re.MULTILINE))
    auto_has_ja = bool(re.search(r"^\s*ja\b", auto_section, re.MULTILINE))

    if manual_has_ja:
        return {"has_japanese": True, "subtitle_type": "manual"}
    if auto_has_ja:
        return {"has_japanese": True, "subtitle_type": "auto"}
    return {"has_japanese": False, "subtitle_type": None}


async def download_subtitles(youtube_url: str, youtube_id: str) -> str:
    """
    Download Japanese subtitles to /tmp/{youtube_id}.ja.vtt.
    Manual subtitles are preferred over auto-generated.
    Raises HTTP 422 if no Japanese subtitle file is produced.
    """
    output_template = f"/tmp/{youtube_id}"

    proc = await asyncio.create_subprocess_exec(
        "yt-dlp", *_yt_dlp_base_args(),
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs", "ja",
        "--skip-download",
        "--sub-format", "vtt",
        "-o", output_template,
        youtube_url,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    await proc.communicate()

    # yt-dlp may produce files like .ja.vtt or .ja-orig.vtt — find any .ja*.vtt
    candidates = glob.glob(f"/tmp/{youtube_id}.ja*.vtt")
    if not candidates:
        raise HTTPException(
            status_code=422,
            detail="Video ini tidak memiliki subtitle Jepang. Coba video lain.",
        )

    # Prefer the plain .ja.vtt (manual) over auto-generated variants
    plain = f"/tmp/{youtube_id}.ja.vtt"
    return plain if plain in candidates else candidates[0]


async def get_video_metadata(youtube_url: str) -> dict:
    """
    Fetch video metadata using yt-dlp --dump-json.
    Returns {"id": ..., "title": ..., "channel": ...}
    """
    import json

    proc = await asyncio.create_subprocess_exec(
        "yt-dlp", *_yt_dlp_base_args(), "--dump-json", "--no-playlist", youtube_url,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    raw = stdout.decode("utf-8").strip()

    if not raw:
        err = stderr.decode("utf-8", errors="replace").strip()
        raise HTTPException(
            status_code=422,
            detail=f"Tidak bisa mengambil metadata video. Pastikan URL valid dan video bisa diakses. ({err[:200] if err else 'no output'})",
        )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Gagal memproses metadata video.")

    return {
        "id": data.get("id"),
        "title": data.get("title"),
        "channel": data.get("channel") or data.get("uploader"),
    }


def parse_vtt(vtt_path: str) -> list[dict]:
    """
    Parse a .vtt file into a list of sentence dicts:
    [{"text": "...", "start_time": 0.0, "end_time": 2.5, "duration": 2.5}, ...]

    Rules:
    - Skip WEBVTT header, NOTE blocks, and blank lines
    - Parse timestamps: 00:00:00.000 --> 00:00:02.500
    - Strip HTML tags (<c>, <ruby>, <rt>, etc.)
    - Merge multi-line text for the same cue
    - Skip consecutive duplicate texts (auto-subtitle artifact)
    """
    _TAG_RE = re.compile(r"<[^>]+>")
    _TS_RE = re.compile(
        r"(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})"
    )

    def parse_ts(ts: str) -> float:
        ts = ts.replace(",", ".")
        parts = ts.split(":")
        h, m, s = int(parts[0]), int(parts[1]), float(parts[2])
        return h * 3600 + m * 60 + s

    with open(vtt_path, encoding="utf-8") as f:
        raw = f.read()

    results: list[dict] = []
    last_text: str | None = None

    # Split into cue blocks by blank lines
    blocks = re.split(r"\n\s*\n", raw)
    for block in blocks:
        lines = [l.strip() for l in block.strip().splitlines()]
        if not lines:
            continue

        # Skip header and NOTE blocks
        if lines[0].startswith("WEBVTT") or lines[0].startswith("NOTE"):
            continue

        # Find the timestamp line
        ts_line_idx = None
        for i, line in enumerate(lines):
            if _TS_RE.match(line):
                ts_line_idx = i
                break
        if ts_line_idx is None:
            continue

        m = _TS_RE.match(lines[ts_line_idx])
        start_time = parse_ts(m.group(1))
        end_time = parse_ts(m.group(2))

        # Collect text lines after the timestamp
        text_lines = lines[ts_line_idx + 1:]
        text = " ".join(text_lines).strip()
        text = _TAG_RE.sub("", text).strip()

        if not text:
            continue

        # Skip consecutive duplicates (auto-subtitle artifact)
        if text == last_text:
            continue
        last_text = text

        duration = round(end_time - start_time, 3)
        results.append({
            "text": text,
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration,
        })

    return results
