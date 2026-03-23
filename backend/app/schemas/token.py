from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """
    Schema for the access and refresh tokens returned on login.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Schema for the data encoded within the JWT access token.
    """
    sub: Optional[str] = None  # 'sub' is the standard JWT claim for subject (user ID)
