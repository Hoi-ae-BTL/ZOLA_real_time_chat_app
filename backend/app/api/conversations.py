# File: app/api/conversations.py
from fastapi import APIRouter
from backend.app.schemas.conversation import ConversationCreate, ConversationDetailResponse

# Khởi tạo Router và gắn Tag để tài liệu nhóm các API lại cho đẹp
router = APIRouter(prefix="/api/conversations", tags=["Conversations (Nhắn tin)"])


# Gắn Schema đầu vào (data) và Schema đầu ra (response_model)
@router.post("/", response_model=ConversationDetailResponse)
async def create_conversation(data: ConversationCreate):
    """
    **API Tạo cuộc trò chuyện mới (1-1 hoặc Group)**

    - Truyền đúng `type` là 'direct' hoặc 'group'.
    - Không cần gửi `sender_id`, Backend sẽ tự lấy qua Token.
    """
    pass