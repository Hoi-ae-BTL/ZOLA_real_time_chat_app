from fastapi import APIRouter, Depends, status, Response
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, get_current_user
from backend.app.db.base import User
from backend.app.schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendResponse, FriendInfo
from backend.app.services import friend_service

# Tạo nhóm API Bạn bè
router = APIRouter(prefix="/api/friends", tags=["Friends (Bạn bè)"])


# ---------------------------------------------------------
# QUẢN LÝ LỜI MỜI KẾT BẠN (FRIEND REQUESTS)
# ---------------------------------------------------------

@router.post("/requests", response_model=FriendRequestResponse, status_code=status.HTTP_201_CREATED)
async def handle_send_friend_request(
    data: FriendRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Gửi lời mời kết bạn**

    - Chỉ cần truyền `to_user_id` (ID của người muốn kết bạn)
    và `message` (Câu chào hỏi, có thể để trống).
    """
    friend_request = await friend_service.send_friend_request(
        db=db, current_user=current_user, request_data=data
    )
    return friend_request


@router.get("/requests", response_model=List[FriendRequestResponse])
async def handle_get_all_friend_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Lấy danh sách tất cả lời mời kết bạn (đã gửi và đã nhận)**

    - Frontend có thể dựa vào `from_user_id` và `to_user_id` để phân loại.
    """
    sent, received = await friend_service.get_all_friend_requests(db=db, current_user=current_user)
    return sent + received


@router.post("/requests/{request_id}/accept", response_model=FriendResponse)
async def handle_accept_friend_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Đồng ý kết bạn**

    - Frontend gọi API này khi user bấm nút "Chấp nhận".
    - Trả về thông tin tình bạn (FriendResponse) vừa được tạo trong DB.
    """
    friendship = await friend_service.accept_friend_request(
        db=db, request_id=request_id, current_user=current_user
    )
    return friendship


@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def handle_decline_or_cancel_friend_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Từ chối lời mời kết bạn (Hoặc tự hủy lời mời mình đã gửi)**
    """
    await friend_service.decline_or_cancel_friend_request(
        db=db, request_id=request_id, current_user=current_user
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------
# QUẢN LÝ DANH BẠ (FRIENDS)
# ---------------------------------------------------------

@router.get("/", response_model=List[FriendInfo])
async def handle_get_my_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Lấy danh sách bạn bè (Danh bạ)**

    - Dùng để vẽ màn hình danh sách bạn bè đang có.
    """
    # Lấy danh sách các mối quan hệ bạn bè (Friend objects)
    friendships = await friend_service.get_all_friends(db=db, current_user=current_user)

    # Trích xuất thông tin của "người bạn kia" từ mỗi mối quan hệ
    friend_list = []
    for friendship in friendships:
        if friendship.user_a_rel.id == current_user.id:
            friend_list.append(friendship.user_b_rel)
        else:
            friend_list.append(friendship.user_a_rel)
    return friend_list


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def handle_unfriend(
    friend_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    **API Hủy kết bạn (Unfriend)**
    """
    await friend_service.unfriend(db=db, friend_id=friend_id, current_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)