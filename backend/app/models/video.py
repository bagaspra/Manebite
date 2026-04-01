from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship

from app.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    youtube_id = Column(Text, unique=True, nullable=False)
    title = Column(Text)
    channel = Column(Text)
    language = Column(Text, default="ja")
    difficulty = Column(Text)
    is_public = Column(Boolean, default=False)
    submitted_by = Column(Text, nullable=True)  # user_id
    created_at = Column(TIMESTAMP, server_default=func.now())

    sentences = relationship("Sentence", back_populates="video", cascade="all, delete-orphan")
    user_progresses = relationship("UserProgress", back_populates="video", cascade="all, delete-orphan")
