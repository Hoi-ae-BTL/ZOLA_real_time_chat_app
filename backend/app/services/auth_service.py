from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from backend.app.crud.crud_user import get_user_by_username
from backend.app.core.security import verify_password, create_access_token, create_refresh_token
from backend.app.db.base import Session

# Hàm xác thực người dùng 
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
    
    # Bước 6: Trả kết quả về cho API 
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }

async def logout_user(db: AsyncSession, refresh_token: str) -> None:
    # Xóa bản ghi chứa thẻ dài hạn này khỏi Database vĩnh viễn
    stmt = delete(Session).where(Session.refresh_token == refresh_token)
    await db.execute(stmt)
    await db.commit() # Chốt sổ lệnh xóa

async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    # 1. Tìm Session chứa mã này trong Database
    stmt = select(Session).where(Session.refresh_token == refresh_token)
    result = await db.execute(stmt)
    db_session = result.scalars().first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh Token không hợp lệ hoặc đã bị đăng xuất",
        )
    
    # 2. Kiểm tra xem Refresh Token đã quá hạn 14 ngày chưa
    if db_session.expires_at < datetime.now(timezone.utc):
        await db.delete(db_session) # Xóa bỏ thẻ rác trong DB
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
        )
    
    # 3. Mọi thứ hợp lệ -> In Access Token mới cho User
    access_token = create_access_token(data={"sub": str(db_session.user_id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }