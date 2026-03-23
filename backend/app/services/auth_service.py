from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.crud.crud_user import get_user_by_username
from backend.app.core.security import verify_password, create_access_token, create_refresh_token
from backend.app.db.base import Session

async def authenticate_user(db: AsyncSession, username: str, password: str) -> dict:
    # Bước 1: Tìm người dùng trong Database
    user = await get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Bước 2: Xác thực mật khẩu
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Bước 3 & 4: Tạo Access Token và Refresh Token
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token()
    
    # Bước 5: Lưu Refresh Token vào Database (bảng Session)
    expires_at = datetime.now(timezone.utc) + timedelta(days=14) # Hạn sống 14 ngày
    db_session = Session(user_id=user.id, refresh_token=refresh_token, expires_at=expires_at)
    
    db.add(db_session)
    await db.flush() # Ghi nháp (file deps.py sẽ tự động commit khi request thành công)
    
    # Bước 6: Trả kết quả về cho API gọt giũa
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }