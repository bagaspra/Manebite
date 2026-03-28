from sqlalchemy import Column, Integer, Text, ForeignKey

from app.database import Base


class HcWord(Base):
    __tablename__ = "hc_words"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    sentence_id = Column(Integer, ForeignKey("sentences.id", ondelete="CASCADE"), nullable=False)
    video_id    = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    surface     = Column(Text, nullable=False)   # bentuk asli di kalimat (買って, 食べました)
    base_form   = Column(Text)                   # bentuk kamus (買う, 食べる)
    reading     = Column(Text)                   # hiragana reading
    pos         = Column(Text)                   # part of speech (名詞, 動詞, 助詞, dll)
    position    = Column(Integer)                # urutan token dalam kalimat
