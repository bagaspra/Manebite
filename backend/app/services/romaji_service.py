import pykakasi


def generate_romaji(text_ja: str) -> str:
    """
    Convert Japanese text to romaji using pykakasi (Hepburn romanisation).
    """
    kks = pykakasi.kakasi()
    result = kks.convert(text_ja)
    return " ".join(item["hepburn"] for item in result if item["hepburn"])
