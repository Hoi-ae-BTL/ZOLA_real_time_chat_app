from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.db.base import User
from backend.app.schemas.user import UserCreate
from backend.app.core.security import get_password_hash


async def get_user(db: AsyncSession, user_id: str) -> User | None:
    """
    Get a user by their ID.
    """
    return await db.get(User, user_id)


async def get_users_by_ids(db: AsyncSession, user_ids: List[str]) -> List[User]:
    """
    Get a list of users by their IDs.
    """
    stmt = select(User).where(User.id.in_(user_ids))
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    # find user in the database

    # statement
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()  # retreives the first record founed, ì not found return None
    # scalers() means all the rows that return after executed the statement


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    # find user in the database
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()


async def create_user(db: AsyncSession, obj_in: UserCreate) -> User:
    """save the user from the request into database"""
    # password hashing
    hashed_password = get_password_hash(obj_in.password)

    # Create the user from the request
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
    # use the session object to add to database
    db.add(db_user)
    await db.commit()
    await db.refresh(
        db_user
    )  # Cập nhật lại db_user để lấy các trường tự tăng như `id`, `created_at`

    return db_user
