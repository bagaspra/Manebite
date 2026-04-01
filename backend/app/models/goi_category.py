from sqlalchemy import Column, Integer, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship

from app.database import Base


class GoiCategory(Base):
    __tablename__ = "goi_categories"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name_ja    = Column(Text, nullable=False)
    name_en    = Column(Text, nullable=False)
    name_id    = Column(Text, nullable=False)
    icon       = Column(Text, server_default="📚")
    sort_order = Column(Integer, server_default="0")
    created_at = Column(TIMESTAMP, server_default=func.now())

    packs = relationship("GoiPack", back_populates="category", cascade="all, delete-orphan")
