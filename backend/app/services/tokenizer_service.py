import unidic_lite
import fugashi

_tagger = None


def get_tagger() -> fugashi.Tagger:
    global _tagger
    if _tagger is None:
        # Use unidic-lite dictionary (installed via pip, no apt mecab-ipadic needed)
        _tagger = fugashi.Tagger(f"-d {unidic_lite.DICDIR}")
    return _tagger


def tokenize(text: str) -> list[dict]:
    """
    Tokenize Japanese text using MeCab via fugashi.

    Returns a list of dicts with keys:
      surface   - bentuk asli (買って, 食べました)
      base_form - bentuk kamus (買う, 食べる)
      reading   - hiragana reading
      pos       - part of speech (名詞, 動詞, 助詞, dll)
      position  - index urutan token dalam kalimat

    Tokens yang di-skip:
    - pos dimulai dengan 助詞 (particle), 助動詞 (auxiliary verb),
      記号/補助記号 (punctuation), BOS/EOS
    - surface hanya whitespace atau tanda baca
    - single character non-kanji/non-kana
    """
    tagger = get_tagger()
    tokens: list[dict] = []
    position = 0

    for word in tagger(text):
        surface: str = word.surface

        if not surface or not surface.strip():
            continue

        try:
            feature = word.feature
            pos: str = feature.pos1 if hasattr(feature, "pos1") else str(feature).split(",")[0]
            base: str = feature.lemma if hasattr(feature, "lemma") else surface
            reading: str = feature.kana if hasattr(feature, "kana") else surface
        except Exception:
            pos = ""
            base = surface
            reading = surface

        skip_pos = ["助詞", "助動詞", "記号", "補助記号", "BOS/EOS"]
        if any(pos.startswith(s) for s in skip_pos):
            continue

        # Skip single non-Japanese characters (punctuation, latin, etc.)
        if len(surface) == 1 and not any("\u3040" <= c <= "\u9fff" for c in surface):
            continue

        tokens.append({
            "surface": surface,
            "base_form": base or surface,
            "reading": reading or surface,
            "pos": pos,
            "position": position,
        })
        position += 1

    return tokens
