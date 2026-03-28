from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import videos, session, auth, proxy, keigo, hongocut

# Import all models so Base.metadata knows about them
import app.models.video  # noqa: F401
import app.models.sentence  # noqa: F401
import app.models.user_progress  # noqa: F401
import app.models.user  # noqa: F401
import app.models.keigo_history  # noqa: F401
import app.models.hc_word  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: create tables if they don't exist.
    # In production this is replaced by Alembic migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Shadowing Queue API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(session.router)
app.include_router(proxy.router)
app.include_router(keigo.router, prefix="/keigo")
app.include_router(hongocut.router)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
