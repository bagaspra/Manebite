from pydantic import BaseModel
from typing import Optional


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name_ja: str
    name_en: str
    name_id: str
    icon: str = "📚"
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name_ja: str
    name_en: str
    name_id: str
    icon: str
    sort_order: int = 0


class CategoryOut(BaseModel):
    id: int
    name_ja: str
    name_en: str
    name_id: str
    icon: str
    sort_order: int

    model_config = {"from_attributes": True}


class CategoryWithCount(CategoryOut):
    pack_count: int


# ── Pack ──────────────────────────────────────────────────────────────────────

class PackCreate(BaseModel):
    category_id: int
    name_ja: str
    name_en: str
    name_id: str
    description: Optional[str] = None


class PackUpdate(BaseModel):
    name_ja: str
    name_en: str
    name_id: str
    description: Optional[str] = None
    words: list["WordInput"] = []


class PackOut(BaseModel):
    id: int
    category_id: int
    name_ja: str
    name_en: str
    name_id: str
    description: Optional[str]
    word_count: int
    is_published: bool
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class PackAdminOut(PackOut):
    category_name_ja: str
    category_name_en: str


# ── Word ──────────────────────────────────────────────────────────────────────

class WordInput(BaseModel):
    surface: str
    reading: str
    jlpt_level: int               # 5=N5, 4=N4, 3=N3, 2=N2, 1=N1
    meaning_en: str
    meaning_id: str
    examples_ja: list[str]        # 3 plain sentences
    examples_ja_ruby: Optional[list[str]] = None  # 3 ruby-annotated sentences
    examples_en: list[str]
    examples_id: list[str]
    sort_order: int = 0


class WordOut(BaseModel):
    id: int
    surface: str
    reading: str
    jlpt_level: int
    meaning_en: str
    meaning_id: str
    examples_ja: list[str]
    examples_ja_ruby: Optional[list[str]] = None
    examples_en: list[str]
    examples_id: list[str]
    sort_order: int

    model_config = {"from_attributes": True}


# ── Pack detail (public) ───────────────────────────────────────────────────────

class PackDetailOut(BaseModel):
    pack: PackOut
    words: list[WordOut]


# ── Pack detail (admin, includes words) ──────────────────────────────────────

class PackAdminDetailOut(BaseModel):
    pack: PackAdminOut
    words: list[WordOut]


# ── Gemini generate response ──────────────────────────────────────────────────

class GenerateWordsResponse(BaseModel):
    words: list[WordInput]
