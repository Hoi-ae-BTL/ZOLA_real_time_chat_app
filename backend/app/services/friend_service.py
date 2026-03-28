from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Tuple

from backend.app.crud import crud_friend, crud_user
from backend.app.db.base import FriendRequest, User, Friend
from backend.app.schemas.friend import FriendRequestCreate


async def send_friend_request(
    db: AsyncSession, *, current_user: User, request_data: FriendRequestCreate
) -> FriendRequest:
    """
    Service để xử lý logic gửi lời mời kết bạn.
    """
    # 1. Kiểm tra xem người nhận có tồn tại không
    receiver = await crud_user.get_user_by_id(db, user_id=request_data.to_user_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng bạn muốn kết bạn không tồn tại."
        )

    # 2. Kiểm tra xem người dùng có tự gửi lời mời cho chính mình không
    if current_user.id == receiver.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự gửi lời mời kết bạn cho chính mình.",
        )

    # 3. Kiểm tra xem hai người đã là bạn bè chưa
    are_friends = await crud_friend.check_if_friends(db, user1_id=current_user.id, user2_id=receiver.id)
    if are_friends:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn đã là bạn bè với người này."
        )

    # 4. Kiểm tra xem đã có lời mời nào tồn tại giữa hai người chưa (theo cả 2 chiều)
    existing_request = await crud_friend.check_if_request_sent(db, user1_id=current_user.id, user2_id=receiver.id)
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Lời mời kết bạn đã được gửi đi trước đó."
        )

    # 5. Nếu tất cả kiểm tra đều qua, tạo lời mời kết bạn trong DB
    friend_request = await crud_friend.create_friend_request(db, from_user_id=current_user.id, obj_in=request_data)

    return friend_request


async def accept_friend_request(
    db: AsyncSession, *, request_id: str, current_user: User
) -> Friend:
    """
    Service để xử lý logic chấp nhận lời mời kết bạn.
    """
    # 1. Lấy lời mời kết bạn
    friend_request = await crud_friend.get_friend_request_by_id(db, request_id=request_id)
    if not friend_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lời mời kết bạn không tồn tại."
        )

    # 2. Kiểm tra quyền hạn: Người chấp nhận phải là người nhận lời mời
    if friend_request.to_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền chấp nhận lời mời này."
        )

    # 3. Sắp xếp ID để tạo bản ghi Friend chuẩn hóa
    user_a_id = min(friend_request.from_user_id, friend_request.to_user_id)
    user_b_id = max(friend_request.from_user_id, friend_request.to_user_id)

    # 4. Tạo bản ghi tình bạn mới
    friendship = await crud_friend.create_friend(db, user1_id=user_a_id, user2_id=user_b_id)

    # 5. Xóa lời mời kết bạn cũ
    await crud_friend.delete_friend_request(db, request_id=request_id)

    return friendship


async def decline_or_cancel_friend_request(
    db: AsyncSession, *, request_id: str, current_user: User
) -> None:
    """
    Service để xử lý logic từ chối lời mời kết bạn hoặc hủy lời mời đã gửi.
    """
    friend_request = await crud_friend.get_friend_request_by_id(db, request_id=request_id)
    if not friend_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lời mời kết bạn không tồn tại.")

    if (friend_request.from_user_id != current_user.id and friend_request.to_user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền thực hiện hành động này.")

    await crud_friend.delete_friend_request(db, request_id=request_id)


async def get_all_friend_requests(db: AsyncSession, *, current_user: User) -> Tuple[List[FriendRequest], List[FriendRequest]]:
    sent = await crud_friend.get_sent_friend_requests(db, user_id=current_user.id)
    received = await crud_friend.get_received_friend_requests(db, user_id=current_user.id)
    return sent, received


async def get_all_friends(db: AsyncSession, *, current_user: User) -> List[Friend]:
    return await crud_friend.get_friends(db, user_id=current_user.id)


async def unfriend(db: AsyncSession, *, friend_id: str, current_user: User) -> None:
    friendship = await crud_friend.delete_friendship(db, friend_id=friend_id)
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mối quan hệ bạn bè không tồn tại.")
    if friendship.user_a != current_user.id and friendship.user_b != current_user.id:
        # This check is an extra layer of security, although unlikely to be triggered
        # if the frontend only shows the unfriend button for actual friends.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền hủy kết bạn này.")