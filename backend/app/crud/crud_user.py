from sqlalchemy.ext.asyncio import AsyncSession
# a session static class that provides function to work with database in asynchronous style
from sqlalchemy.future import select
# the SELECT sql code but in python (its a function btw)
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
