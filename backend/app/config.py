from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue"

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        # Normalize driver: replace postgresql:// or postgresql+psycopg2:// with asyncpg
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        # Normalize SSL param: asyncpg uses ?ssl=require, not ?sslmode=require
        url = url.replace("sslmode=require", "ssl=require")
        return url
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""
    # Stored as raw comma-separated strings; use properties to get list
    ADMIN_USER_IDS: str = ""
    ALLOWED_ORIGINS: str = ""

    @property
    def admin_user_ids(self) -> list[str]:
        return [x.strip() for x in self.ADMIN_USER_IDS.split(",") if x.strip()]

    @property
    def allowed_origins(self) -> list[str]:
        origins = [x.strip() for x in self.ALLOWED_ORIGINS.split(",") if x.strip()]
        return origins if origins else [self.FRONTEND_URL, "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"


settings = Settings()


