from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    img_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None

class MessageCreate(MessageBase):
    conversation_id: str
    # 💡 Tương tự, sender_id lấy từ Token, không nhận từ Request Body

class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    img_url: Optional[str] = None

class MessageResponse(MessageBase):
    id: str
    sender_id: str
    conversation_id: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field(
        alias="content"
    )
    @property
    def display_content(self) -> Optional[str]:
        if self.is_deleted:
            return "Tin nhắn đã bị thu hồi"
        return self.content
