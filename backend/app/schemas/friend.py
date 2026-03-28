from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

from .user import UserResponse

# =====================================================================================
# Friend Request Schemas
# =====================================================================================

class FriendRequestBase(BaseModel):
    """Các trường chung của một lời mời kết bạn."""
    message: Optional[str] = Field(None, max_length=300)


class FriendRequestCreate(BaseModel):
    """Schema để tạo một lời mời kết bạn mới (dữ liệu Frontend gửi lên)."""
    to_user_id: str
    message: Optional[str] = Field(None, max_length=300)


class FriendRequestResponse(BaseModel):
    """Schema trả về thông tin chi tiết của một lời mời kết bạn."""
    id: str
    from_user_id: str
    to_user_id: str
    message: Optional[str]
    created_at: datetime
    sender: UserResponse
    receiver: UserResponse

    class Config:
        from_attributes = True


# =====================================================================================
# Friend Schemas
# =====================================================================================

class FriendResponse(BaseModel):
    """Schema trả về thông tin của một mối quan hệ bạn bè."""
    id: str
    created_at: datetime
    user_a: UserResponse = Field(validation_alias='user_a_rel')
    user_b: UserResponse = Field(validation_alias='user_b_rel')

    class Config:
        from_attributes = True


class FriendInfo(BaseModel):
    """Schema trả về thông tin cơ bản của một người bạn để hiển thị trong danh bạ."""
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True