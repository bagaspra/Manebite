import uuid

import bcrypt
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserOut, OAuthUpsertRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    if not body.password:
        raise HTTPException(status_code=422, detail="Password is required for credentials registration.")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        name=body.name,
        provider="credentials",
        hashed_password=_hash(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
async def login(body: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not _verify(body.password or "", user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Auth.js manages the session; we only return identity so the callback can build the token.
    return {"user_id": user.id, "email": user.email, "name": user.name}


@router.post("/oauth-upsert")
async def oauth_upsert(body: OAuthUpsertRequest, db: AsyncSession = Depends(get_db)):
    """Create-or-get a user record for OAuth sign-ins.
    Lookup is by email; if the row already exists (any provider) we return the
    existing stable UUID so submitted_by stays consistent across re-logins.
    """
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=body.email,
            name=body.name,
            image=body.image,
            provider=body.provider,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return {"user_id": user.id, "email": user.email, "name": user.name}


@router.get("/me", response_model=UserOut)
async def me(
    x_user_id: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    user = await db.scalar(select(User).where(User.id == x_user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return user
