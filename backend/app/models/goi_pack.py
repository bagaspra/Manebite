from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class GoiPack(Base):
    __tablename__ = "goi_packs"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    category_id  = Column(Integer, ForeignKey("goi_categories.id", ondelete="CASCADE"), nullable=False)
    name_ja      = Column(Text, nullable=False)
    name_en      = Column(Text, nullable=False)
    name_id      = Column(Text, nullable=False)
    description  = Column(Text)
    word_count   = Column(Integer, server_default="0")
    is_published = Column(Boolean, server_default="false")
    created_by   = Column(Text)
    created_at   = Column(TIMESTAMP, server_default=func.now())
    updated_at   = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    category = relationship("GoiCategory", back_populates="packs")
    words    = relationship("GoiWord", back_populates="pack", cascade="all, delete-orphan")
