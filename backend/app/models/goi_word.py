from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class GoiWord(Base):
    __tablename__ = "goi_words"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    pack_id     = Column(Integer, ForeignKey("goi_packs.id", ondelete="CASCADE"), nullable=False)
    surface     = Column(Text, nullable=False)
    reading     = Column(Text, nullable=False)
    jlpt_level  = Column(Integer, nullable=False)  # 5=N5, 4=N4, 3=N3, 2=N2, 1=N1
    meaning_en  = Column(Text, nullable=False)
    meaning_id  = Column(Text, nullable=False)
    examples_ja      = Column(JSONB, nullable=False)  # ["sentence1", "sentence2", "sentence3"]
    examples_ja_ruby = Column(JSONB, nullable=True)   # ["<ruby>漢字<rt>かんじ</rt></ruby>...", ...]
    examples_en      = Column(JSONB, nullable=False)
    examples_id      = Column(JSONB, nullable=False)
    sort_order       = Column(Integer, server_default="0")
    created_at  = Column(TIMESTAMP, server_default=func.now())

    pack = relationship("GoiPack", back_populates="words")
