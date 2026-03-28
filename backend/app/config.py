from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue"
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
