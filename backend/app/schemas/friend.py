from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# --- FRIEND REQUEST ---
class FriendRequestCreate(BaseModel):
    to_user_id: str
    message: Optional[str] = Field(None, max_length=255)
    # 💡 from_user_id sẽ được lấy tự động từ Token, không để Frontend gửi

class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- FRIENDSHIP ---
class FriendResponse(BaseModel):
    id: str
    user_a: str
    user_b: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)