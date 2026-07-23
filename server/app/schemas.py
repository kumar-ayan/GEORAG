from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.campus import is_inside_punjabi_university


class PostCategory(str, Enum):
    SAFETY = "Safety"
    RECOMMENDATION = "Recommendation"
    LOST_FOUND = "Lost&Found"
    EVENT = "Event"
    GENERAL = "General"


class PostCreate(BaseModel):
    text: str = Field(min_length=1, max_length=280)
    category: PostCategory
    public_lat: float = Field(ge=-90, le=90)
    public_lng: float = Field(ge=-180, le=180)
    gps_verified: bool = True
    image_url: str | None = Field(default=None, max_length=2048)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("post text is required")
        return stripped

    @field_validator("image_url")
    @classmethod
    def normalize_image_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def require_campus_location(self) -> "PostCreate":
        if not is_inside_punjabi_university(self.public_lat, self.public_lng):
            raise ValueError("pin must be inside Punjabi University, Patiala")
        return self


class PostResponse(BaseModel):
    id: UUID
    text: str
    category: PostCategory
    public_lat: float
    public_lng: float
    gps_verified: bool
    image_url: str | None
    created_at: datetime
    expires_at: datetime | None


class NearbyPostsResponse(BaseModel):
    posts: list[PostResponse]
