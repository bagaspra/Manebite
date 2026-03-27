from datetime import datetime

from pydantic import BaseModel


class ProgressUpdateRequest(BaseModel):
    sentence_id: int
    replays: int
    completed: bool


class ProgressOut(BaseModel):
    sentence_id: int
    replays: int
    completed: bool
    created_at: datetime | None

    model_config = {"from_attributes": True}


class SessionProgressOut(BaseModel):
    video_id: int
    last_sentence_id: int | None   # First incomplete sentence — resume point
    completed_count: int
    total_sentences: int
    sentences: list[ProgressOut]
