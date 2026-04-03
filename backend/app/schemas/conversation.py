from pydantic import AliasChoices, BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ConversationTypeEnum(str, Enum):
    direct = "direct"
    group = "group"

class ConversationBase(BaseModel):
    type: ConversationTypeEnum
    group_name: Optional[str] = Field(None, max_length=255)

# Get list members
class ParticipantResponse(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Create new group
class ConversationCreate(ConversationBase):
    # Khi tạo hội thoại, Frontend cần gửi lên danh sách những người tham gia
    user_ids: List[str] = Field(..., min_length=1)

class ConversationUpdate(BaseModel):
    group_name: Optional[str] = Field(None, max_length=255)

# Response for direct
class ConversationResponse(ConversationBase):
    id: str
    group_created_by: Optional[str] = None
    participant_count: int = 0
    last_message_content: Optional[str] = None
    last_message_created_at: Optional[datetime] = None
    last_message_sender: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Dùng cho API: POST /conversations/{id}/members
class AddMemberRequest(BaseModel):
    user_ids: List[str] = Field(..., min_length=1, description="Danh sách ID người muốn thêm vào nhóm")

# Dùng cho API: DELETE /conversations/{id}/members
class RemoveMemberRequest(BaseModel):
    user_id: str = Field(..., description="ID của người bị kick hoặc tự rời nhóm")


# Dùng để ép kiểu dữ liệu từ bảng ConversationSeenBy
class SeenByResponse(BaseModel):
    user_id: str = Field(validation_alias=AliasChoices("user_id", "id"))
    seen_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Response for group
class ConversationDetailResponse(ConversationResponse):
    participants: List[ParticipantResponse] = []
    seen_by: List[SeenByResponse] = []
