from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    img_url: Optional[str] = None

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
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)