from datetime import datetime

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship

from app.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Text, nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    sentence_id = Column(Integer, ForeignKey("sentences.id"), nullable=False)
    replays = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    video = relationship("Video", back_populates="user_progresses")
    sentence = relationship("Sentence", back_populates="user_progresses")
