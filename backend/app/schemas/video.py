from datetime import datetime

from pydantic import BaseModel, field_validator


class VideoSubmitRequest(BaseModel):
    youtube_url: str

    @field_validator("youtube_url")
    @classmethod
    def must_be_youtube(cls, v: str) -> str:
        if "youtube.com" not in v and "youtu.be" not in v:
            raise ValueError("URL harus berupa link YouTube (youtube.com atau youtu.be)")
        return v


class SentenceOut(BaseModel):
    id: int
    sequence_no: int | None
    text_ja: str
    text_romaji: str | None
    start_time: float
    end_time: float
    duration: float | None

    model_config = {"from_attributes": True}


class VideoOut(BaseModel):
    id: int
    youtube_id: str
    title: str | None
    channel: str | None
    language: str | None
    difficulty: str | None
    is_public: bool | None
    submitted_by: str | None
    created_at: datetime | None
    sentence_count: int = 0

    model_config = {"from_attributes": True}


class VideoDetailOut(VideoOut):
    sentences: list[SentenceOut] = []


class VideoSubmitResponse(BaseModel):
    video: VideoOut
    sentences_count: int
    message: str
