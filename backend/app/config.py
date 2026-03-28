from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue"
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    GEMINI_API_KEY: str = ""
    # Stored as raw comma-separated string; use .admin_user_ids property to get list
    ADMIN_USER_IDS: str = ""

    @property
    def admin_user_ids(self) -> list[str]:
        return [x.strip() for x in self.ADMIN_USER_IDS.split(",") if x.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
