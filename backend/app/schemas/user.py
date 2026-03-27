from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None
    image: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    email: str
    name: str | None = None
    password: str | None = None  # Optional — not needed for OAuth users


class OAuthUpsertRequest(BaseModel):
    email: str
    name: str | None = None
    image: str | None = None
    provider: str  # "google" | etc.
