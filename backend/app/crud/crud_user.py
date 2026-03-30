from sqlalchemy.ext.asyncio import AsyncSession
# a session static class that provides function to work with database in asynchronous style
from sqlalchemy import select, or_
# the SELECT sql code but in python (its a function btw)
from typing import List
from backend.app.db.base import User
# import the User class from the base.py file (which was used to generate the schema of the database)
from backend.app.schemas.user import UserCreate
# import the UserCreate class from the user.py file
from backend.app.core.security import get_password_hash
# import the get_password_hash function from the security.py file

async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    # Tìm user trong db bằng ID
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()

# for asynchronous fucntions, add the async keyword before writin
async def get_user_by_username(db: AsyncSession, username: str)-> User|None:
    #find user in the database

    #statement
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first() # retreives the first record founed, ì not found return None
    #scalers() means all the rows that return after executed the statement

async def get_user_by_email(db: AsyncSession, email: str)-> User|None:
    #find user in the database
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_user(db: AsyncSession, obj_in: UserCreate) -> User:
    """save the user from the request into database"""
    #password hashing
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
        phone=obj_in.phone
    )
    #use the session object to add to database
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user) # Cập nhật lại db_user để lấy các trường tự tăng như `id`, `created_at`
    
    return db_user
# Thêm vào cuối file backend/app/crud/crud_user.py

async def get_users_by_ids(db: AsyncSession, user_ids: list[str]) -> list[User]:
    """Lấy danh sách người dùng dựa trên danh sách các ID."""
    if not user_ids:
        return []
    stmt = select(User).where(User.id.in_(user_ids))
    result = await db.execute(stmt)
    return result.scalars().all()


async def search_users(db: AsyncSession, *, keyword: str, current_user_id: str) -> List[User]:
    """
    Tìm kiếm người dùng theo username hoặc display_name, không bao gồm user hiện tại.
    """
    search_term = f"%{keyword}%"
    statement = (
        select(User)
        .where(
            or_(
                User.username.ilike(search_term),
                User.display_name.ilike(search_term)
            )
        )
        .where(User.id != current_user_id)
    )
    result = await db.execute(statement)
    return result.scalars().all()
