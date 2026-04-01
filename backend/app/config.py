from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue"
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


