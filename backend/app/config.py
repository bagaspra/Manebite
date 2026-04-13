from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shadowing:shadowing@postgres:5432/shadowing_queue"

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        # Normalize driver scheme to asyncpg
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)

        # Strip query params that asyncpg doesn't support (libpq-only params).
        # Keep sslmode as-is — asyncpg accepts it with values: disable, allow,
        # prefer, require, verify-ca, verify-full.
        parsed = urlparse(url)
        params = parse_qsl(parsed.query, keep_blank_values=True)
        filtered = [(k, v) for k, v in params if k not in ("channel_binding", "gssencmode")]
        new_query = urlencode(filtered)
        return urlunparse(parsed._replace(query=new_query))
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


