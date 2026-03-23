from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db
from backend.app.schemas.user import Token
from backend.app.services.auth_service import authenticate_user

# Định nghĩa Router
router = APIRouter(prefix="/api/auth", tags=["Auth (Đăng nhập & Token)"])

@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), # Tự động móc username và password từ body
    db: AsyncSession = Depends(get_db)
):
    """
    **API Đăng nhập cấp Token**
    """
    # Gọi hàm xử lý logic từ file auth_service
    tokens = await authenticate_user(db, form_data.username, form_data.password)
    
    # Đính kèm Refresh Token vào Cookie bảo mật
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,             # Chống Hacker dùng JS đọc trộm Cookie (Chống XSS)
        max_age=14 * 24 * 60 * 60, # Tồn tại 14 ngày
        samesite="none",           # Cho phép gửi cookie chéo domain (Frontend và Backend chạy khác port)
        secure=True                # Bắt buộc khi dùng samesite="none", yêu cầu HTTPS (trình duyệt cho phép localhost)
    )
    return tokens