from sqlalchemy import Column, Integer, Text, TIMESTAMP, func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)          # UUID string, set by application
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    image = Column(Text)                          # Avatar URL (from OAuth)
    provider = Column(Text)                       # "google" | "credentials"
    hashed_password = Column(Text, nullable=True) # None for OAuth users
    jlpt_level = Column(Integer, nullable=True)  # 5=N5, 4=N4, 3=N3, 2=N2, 1=N1, None=not set
    created_at = Column(TIMESTAMP, server_default=func.now())
