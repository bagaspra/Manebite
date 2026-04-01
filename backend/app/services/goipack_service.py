import json
import logging
import os

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GENERATE_PROMPT_TEMPLATE = """\
You are a Japanese language education expert. Generate a vocabulary list for the following topic/niche.

Topic: {pack_name_en} ({pack_name_ja})
Description: {pack_description}
Category: {category_name_en}

Requirements:
- Generate 15-30 vocabulary words relevant to this specific topic
- Each word must include: surface (kanji form), reading (hiragana), JLPT level (N5/N4/N3/N2/N1), English meaning, Indonesian meaning
- For each word, provide exactly 3 example sentences that use the word in context relevant to the topic. Each example must be in Japanese, English, and Indonesian.
- For each Japanese example sentence, also provide a "ja_ruby" version with HTML ruby annotation for every kanji/kanji compound. Format: <ruby>漢字<rt>よみがな</rt></ruby>. Leave hiragana, katakana, numbers and punctuation as-is.
  Example: "<ruby>会議<rt>かいぎ</rt></ruby>の<ruby>資料<rt>しりょう</rt></ruby>を<ruby>準備<rt>じゅんび</rt></ruby>してください。"
- Include a mix of JLPT levels (prioritize N4-N2 range but include N5 and N1 where appropriate)
- Order words from most commonly used to least commonly used within this topic
- Avoid overly obscure or archaic words

Respond ONLY with a JSON array, no markdown fences, no explanation:
[
  {{
    "surface": "会議",
    "reading": "かいぎ",
    "jlpt_level": "N4",
    "meaning_en": "meeting, conference",
    "meaning_id": "rapat, pertemuan",
    "examples": [
      {{
        "ja": "明日の会議は何時からですか？",
        "ja_ruby": "<ruby>明日<rt>あした</rt></ruby>の<ruby>会議<rt>かいぎ</rt></ruby>は<ruby>何時<rt>なんじ</rt></ruby>からですか？",
        "en": "What time does tomorrow's meeting start?",
        "id": "Rapat besok mulai jam berapa?"
      }},
      {{
        "ja": "会議の資料を準備してください。",
        "ja_ruby": "<ruby>会議<rt>かいぎ</rt></ruby>の<ruby>資料<rt>しりょう</rt></ruby>を<ruby>準備<rt>じゅんび</rt></ruby>してください。",
        "en": "Please prepare the meeting materials.",
        "id": "Tolong siapkan materi rapatnya."
      }},
      {{
        "ja": "今日の会議は中止になりました。",
        "ja_ruby": "<ruby>今日<rt>きょう</rt></ruby>の<ruby>会議<rt>かいぎ</rt></ruby>は<ruby>中止<rt>ちゅうし</rt></ruby>になりました。",
        "en": "Today's meeting has been canceled.",
        "id": "Rapat hari ini dibatalkan."
      }}
    ]
  }}
]"""

RUBY_PROMPT_TEMPLATE = """\
Add HTML ruby annotation to every kanji/kanji compound in each Japanese sentence below.
Rules:
- Format: <ruby>漢字<rt>よみがな</rt></ruby>
- Leave hiragana, katakana, numbers, punctuation, and spaces as-is (do NOT wrap them in ruby tags)
- Return ONLY a JSON array of strings in the exact same order as the input, no markdown, no explanation

Input sentences:
{sentences_json}"""

JLPT_STR_TO_INT = {"N5": 5, "N4": 4, "N3": 3, "N2": 2, "N1": 1}


def _parse_response(text: str) -> list[dict]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


def _parse_string_array(text: str) -> list[str]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


def _normalize_word(raw: dict, index: int) -> dict:
    """Convert Gemini response word to our schema format."""
    jlpt_str = raw.get("jlpt_level", "N3")
    jlpt_int = JLPT_STR_TO_INT.get(jlpt_str.upper(), 3)

    examples = raw.get("examples", [])
    examples_ja      = [e.get("ja", "")      for e in examples]
    examples_ja_ruby = [e.get("ja_ruby", "") for e in examples]
    examples_en      = [e.get("en", "")      for e in examples]
    examples_id      = [e.get("id", "")      for e in examples]

    # Pad to 3 if Gemini returned fewer
    while len(examples_ja) < 3:
        examples_ja.append("")
        examples_ja_ruby.append("")
        examples_en.append("")
        examples_id.append("")

    # Treat all-empty ruby as None (old data / Gemini didn't provide it)
    ruby = examples_ja_ruby[:3]
    has_ruby = any(r.strip() for r in ruby)

    return {
        "surface": raw.get("surface", ""),
        "reading": raw.get("reading", ""),
        "jlpt_level": jlpt_int,
        "meaning_en": raw.get("meaning_en", ""),
        "meaning_id": raw.get("meaning_id", ""),
        "examples_ja": examples_ja[:3],
        "examples_ja_ruby": ruby if has_ruby else None,
        "examples_en": examples_en[:3],
        "examples_id": examples_id[:3],
        "sort_order": index,
    }


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=GEMINI_API_KEY)


async def generate_pack_words(
    pack_name_ja: str,
    pack_name_en: str,
    pack_description: str,
    category_name_en: str,
) -> list[dict]:
    client = _get_client()
    prompt = GENERATE_PROMPT_TEMPLATE.format(
        pack_name_ja=pack_name_ja,
        pack_name_en=pack_name_en,
        pack_description=pack_description or pack_name_en,
        category_name_en=category_name_en,
    )

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.4),
            )
            if not response.text:
                raise ValueError("Empty response from Gemini")
            raw_words = _parse_response(response.text)
            return [_normalize_word(w, i) for i, w in enumerate(raw_words)]
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Gemini parse error (attempt %d): %s", attempt + 1, e)
            if attempt == 1:
                raise
        except Exception as e:
            error_str = str(e)
            logger.error("Gemini API error: %s", error_str)
            if "quota" in error_str.lower() or "429" in error_str:
                raise RuntimeError("quota_exceeded")
            raise
    return []


async def generate_ruby_for_sentences(sentences: list[str]) -> list[str]:
    """Send plain Japanese sentences to Gemini and get ruby-annotated versions."""
    if not sentences:
        return []

    client = _get_client()
    prompt = RUBY_PROMPT_TEMPLATE.format(
        sentences_json=json.dumps(sentences, ensure_ascii=False, indent=2)
    )

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.1),
            )
            if not response.text:
                raise ValueError("Empty response from Gemini")
            result = _parse_string_array(response.text)
            # Ensure same length as input
            if len(result) < len(sentences):
                result.extend(sentences[len(result):])
            return result[:len(sentences)]
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Ruby parse error (attempt %d): %s", attempt + 1, e)
            if attempt == 1:
                raise
        except Exception as e:
            error_str = str(e)
            logger.error("Gemini ruby error: %s", error_str)
            if "quota" in error_str.lower() or "429" in error_str:
                raise RuntimeError("quota_exceeded")
            raise
    return sentences  # fallback: return plain
