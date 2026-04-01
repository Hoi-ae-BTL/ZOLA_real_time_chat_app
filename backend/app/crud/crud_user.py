from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.core.security import get_password_hash
from backend.app.db.base import User
from backend.app.schemas.user import UserCreate


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()


async def create_user(db: AsyncSession, obj_in: UserCreate) -> User:
    hashed_password = get_password_hash(obj_in.password)

    db_user = User(
        username=obj_in.username,
        email=obj_in.email,
        hashed_password=hashed_password,
        display_name=obj_in.display_name,
        avatar_url=obj_in.avatar_url,
        avatar_id=obj_in.avatar_id,
        bio=obj_in.bio,
        phone=obj_in.phone,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_users_by_ids(db: AsyncSession, user_ids: list[str]) -> list[User]:
    if not user_ids:
        return []
    stmt = select(User).where(User.id.in_(user_ids))
    result = await db.execute(stmt)
    return result.scalars().all()


async def search_users(
    db: AsyncSession,
    *,
    query: str,
    exclude_user_id: str,
    limit: int = 20,
) -> list[User]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    like_value = f"%{normalized_query}%"
    stmt = (
        select(User)
        .where(User.id != exclude_user_id)
        .where(
            or_(
                User.username.ilike(like_value),
                User.display_name.ilike(like_value),
                User.email.ilike(like_value),
            )
        )
        .order_by(User.display_name.asc(), User.username.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
