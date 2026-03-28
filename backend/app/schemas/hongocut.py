from datetime import datetime

from pydantic import BaseModel


class HcVideoSubmitRequest(BaseModel):
    youtube_url: str


class HcSearchResult(BaseModel):
    word_id: int
    surface: str
    base_form: str | None
    reading: str | None
    sentence_id: int
    text_ja: str
    text_romaji: str | None
    start_time: float
    end_time: float
    video_id: int
    youtube_id: str
    title: str | None
    channel: str | None


class HcVideoOut(BaseModel):
    id: int
    youtube_id: str
    title: str | None
    channel: str | None
    word_count: int
    sentence_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class HcSuggestion(BaseModel):
    surface: str
    base_form: str | None
    reading: str | None


class HcPopularWord(BaseModel):
    surface: str
    base_form: str | None
    reading: str | None
