from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

# ... mean "required"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    avatar_id: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=3, max_length=100)
    avatar_url: Optional[str] = None
    avatar_id: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime #fix typo
    model_config = ConfigDict(from_attributes=True)

# define the tokens that backend will return to the front end
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"