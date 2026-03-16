from fastapi import APIRouter
from typing import List
from backend.app.schemas.message import MessageCreate, MessageResponse, MessageUpdate

# Tạo nhóm API Tin nhắn
router = APIRouter(prefix="/api/messages", tags=["Messages (Tin nhắn)"])


@router.post("/", response_model=MessageResponse)
async def send_message(data: MessageCreate):
    """
    **API Gửi tin nhắn (Qua đường HTTP)**

    - Lưu ý: Thường nhắn tin sẽ dùng WebSocket, nhưng vẫn mở API này
    để dự phòng gửi file hoặc gửi tin nhắn dạng cồng kềnh.
    """
    pass


# 💡 Chú ý chỗ `List[MessageResponse]` này: Nó sẽ trả về 1 mảng các tin nhắn
@router.get("/{conversation_id}", response_model=List[MessageResponse])
async def get_chat_history(conversation_id: str):
    """
    **API Lấy lịch sử tin nhắn của một cuộc hội thoại**

    - Dùng để Frontend load tin nhắn cũ khi vừa mở Group Chat.
    - Bổ sung Phân trang/Cursor
    """
    pass


@router.delete("/{message_id}")
async def revoke_message(message_id: str):
    """
    **API Thu hồi tin nhắn (Chỉ đổi is_deleted = True)**
    """
    pass