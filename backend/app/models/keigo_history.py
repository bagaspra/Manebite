from sqlalchemy import Column, Integer, Text, TIMESTAMP, ARRAY
from sqlalchemy.sql import func
from app.database import Base


class KeigoHistory(Base):
    __tablename__ = "keigo_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Text, nullable=False)
    input_text = Column(Text, nullable=False)
    input_mode = Column(Text, nullable=False)  # "en" | "ja"
    output_ja = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    levels_used = Column(ARRAY(Text), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
