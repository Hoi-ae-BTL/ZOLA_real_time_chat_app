from fastapi import APIRouter
from typing import List
from backend.app.schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendResponse

# Tạo nhóm API Bạn bè
router = APIRouter(prefix="/api/friends", tags=["Friends (Bạn bè)"])


# ---------------------------------------------------------
# QUẢN LÝ LỜI MỜI KẾT BẠN (FRIEND REQUESTS)
# ---------------------------------------------------------

@router.post("/requests", response_model=FriendRequestResponse)
async def send_friend_request(data: FriendRequestCreate):
    """
    **API Gửi lời mời kết bạn**

    - Chỉ cần truyền `to_user_id` (ID của người muốn kết bạn)
    và `message` (Câu chào hỏi, có thể để trống).
    """
    pass


@router.get("/requests", response_model=List[FriendRequestResponse])
async def get_pending_requests():
    """
    **API Lấy danh sách lời mời KẾT BẠN ĐẾN (Đang chờ mình xác nhận)**
    """
    pass


@router.post("/requests/{request_id}/accept", response_model=FriendResponse)
async def accept_friend_request(request_id: str):
    """
    **API Đồng ý kết bạn**

    - Frontend gọi API này khi user bấm nút "Chấp nhận".
    - Trả về thông tin tình bạn (FriendResponse) vừa được tạo trong DB.
    """
    pass


@router.delete("/requests/{request_id}")
async def reject_friend_request(request_id: str):
    """
    **API Từ chối lời mời kết bạn (Hoặc tự hủy lời mời mình đã gửi)**
    """
    pass


# ---------------------------------------------------------
# QUẢN LÝ DANH BẠ (FRIENDS)
# ---------------------------------------------------------

@router.get("/", response_model=List[FriendResponse])
async def get_my_friends():
    """
    **API Lấy danh sách bạn bè (Danh bạ)**

    - Dùng để Thế vẽ màn hình danh sách bạn bè đang có.
    """
    pass


@router.delete("/{friend_id}")
async def unfriend(friend_id: str):
    """
    **API Hủy kết bạn (Unfriend)**
    """
    pass