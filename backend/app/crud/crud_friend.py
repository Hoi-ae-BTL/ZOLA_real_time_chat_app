from typing import List, Optional
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.db.base import Friend, FriendRequest, User
from backend.app.schemas.friend import FriendRequestCreate

# =====================================================================================
# Friend Request CRUD
# =====================================================================================

async def create_friend_request(db: AsyncSession, *, from_user_id: str, obj_in: FriendRequestCreate) -> FriendRequest:
    """Tạo một lời mời kết bạn mới trong DB."""
    db_obj = FriendRequest(
        from_user_id=from_user_id,
        to_user_id=obj_in.to_user_id,
        message=obj_in.message
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj) # Tải lại để lấy các giá trị mặc định từ DB như id, created_at

    # Tải lại object một lần nữa với các relationship đã được load sẵn (eager loading)
    # để tránh lỗi lazy loading ở tầng API.
    statement = select(FriendRequest).where(FriendRequest.id == db_obj.id).options(
        selectinload(FriendRequest.sender),
        selectinload(FriendRequest.receiver)
    )
    result = await db.execute(statement)
    return result.scalars().one()

async def get_friend_request_by_id(db: AsyncSession, *, request_id: str) -> Optional[FriendRequest]:
    """Lấy một lời mời kết bạn bằng ID của nó."""
    statement = select(FriendRequest).where(FriendRequest.id == request_id).options(
        selectinload(FriendRequest.sender),
        selectinload(FriendRequest.receiver)
    )
    result = await db.execute(statement)
    return result.scalars().first()

async def get_received_friend_requests(db: AsyncSession, *, user_id: str) -> List[FriendRequest]:
    """Lấy danh sách các lời mời mà một user đã nhận."""
    statement = (
        select(FriendRequest)
        .where(FriendRequest.to_user_id == user_id)
        .options(selectinload(FriendRequest.sender), selectinload(FriendRequest.receiver))
        .order_by(FriendRequest.created_at.desc())
    )
    result = await db.execute(statement)
    return result.scalars().all()

async def get_sent_friend_requests(db: AsyncSession, *, user_id: str) -> List[FriendRequest]:
    """Lấy danh sách các lời mời mà một user đã gửi đi."""
    statement = (
        select(FriendRequest)
        .where(FriendRequest.from_user_id == user_id)
        .options(selectinload(FriendRequest.sender), selectinload(FriendRequest.receiver))
        .order_by(FriendRequest.created_at.desc())
    )
    result = await db.execute(statement)
    return result.scalars().all()




async def check_if_request_sent(db: AsyncSession, *, user1_id: str, user2_id: str) -> Optional[FriendRequest]:
    """Kiểm tra xem đã có lời mời nào tồn tại giữa 2 user hay chưa (theo cả 2 chiều)."""
    statement = select(FriendRequest).where(
        or_(
            and_(FriendRequest.from_user_id == user1_id, FriendRequest.to_user_id == user2_id),
            and_(FriendRequest.from_user_id == user2_id, FriendRequest.to_user_id == user1_id)
        )
    )
    result = await db.execute(statement)
    return result.scalars().first()

async def delete_friend_request(db: AsyncSession, *, request_id: str):
    """Xóa một lời mời kết bạn (khi chấp nhận hoặc từ chối)."""
    db_obj = await get_friend_request_by_id(db, request_id=request_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return db_obj

# =====================================================================================
# Friend CRUD
# =====================================================================================

async def create_friend(db: AsyncSession, *, user1_id: str, user2_id: str) -> Friend:
    """Tạo một bản ghi tình bạn mới. Hàm này giả định ID đã được sắp xếp ở tầng Service."""
    db_obj = Friend(user_a=user1_id, user_b=user2_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    # Tải lại object với các relationship đã được load sẵn (eager loading)
    # để tránh lỗi lazy loading ở tầng API.
    statement = select(Friend).where(Friend.id == db_obj.id).options(
        selectinload(Friend.user_a_rel),
        selectinload(Friend.user_b_rel)
    )
    result = await db.execute(statement)
    return result.scalars().one()

async def get_friends(db: AsyncSession, *, user_id: str) -> List[Friend]:
    """Lấy danh sách bạn bè của một user."""
    statement = (
        select(Friend)
        .where(or_(Friend.user_a == user_id, Friend.user_b == user_id))
        .options(selectinload(Friend.user_a_rel), selectinload(Friend.user_b_rel))
    )
    result = await db.execute(statement)
    return result.scalars().all()

async def check_if_friends(db: AsyncSession, *, user1_id: str, user2_id: str) -> Optional[Friend]:
    """Kiểm tra xem hai user có phải là bạn bè không."""
    u1 = min(user1_id, user2_id)
    u2 = max(user1_id, user2_id)
    statement = select(Friend).where(and_(Friend.user_a == u1, Friend.user_b == u2))
    result = await db.execute(statement)
    return result.scalars().first()

async def delete_friendship(db: AsyncSession, *, friend_id: str) -> Optional[Friend]:
    """Xóa một mối quan hệ bạn bè."""
    statement = select(Friend).where(Friend.id == friend_id)
    result = await db.execute(statement)
    db_obj = result.scalars().first()
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return db_obj