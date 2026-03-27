from sqlalchemy import Column, Text, TIMESTAMP, func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)          # UUID string, set by application
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    image = Column(Text)                          # Avatar URL (from OAuth)
    provider = Column(Text)                       # "google" | "credentials"
    hashed_password = Column(Text, nullable=True) # None for OAuth users
    created_at = Column(TIMESTAMP, server_default=func.now())
