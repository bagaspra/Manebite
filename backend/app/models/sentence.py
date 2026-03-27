from sqlalchemy import Column, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Sentence(Base):
    __tablename__ = "sentences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    sequence_no = Column(Integer)
    text_ja = Column(Text, nullable=False)
    text_romaji = Column(Text)
    text_en = Column(Text)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float)

    video = relationship("Video", back_populates="sentences")
    user_progresses = relationship("UserProgress", back_populates="sentence")
