from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db
from backend.app.schemas.user import Token
from backend.app.services.auth_service import authenticate_user, logout_user, refresh_access_token

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

@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None), # Móc refresh_token từ Cookie mà trình duyệt gửi lên
    db: AsyncSession = Depends(get_db)
):
    """
    **API Đăng xuất (Hủy phiên làm việc)**
    """
    if refresh_token:
        # Gọi Service để đốt hồ sơ Thẻ dài hạn trong Database
        await logout_user(db, refresh_token)
    
    # Ra lệnh cho trình duyệt phải ném chiếc thẻ (Cookie) vào thùng rác
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="none",
        secure=True
    )
    return {"status": "success", "message": "Đăng xuất thành công"}

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    **API Cấp lại Access Token mới**
    - Trình duyệt tự động đính kèm Cookie chứa Refresh Token khi gọi API này.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại."
        )
    
    # Đẩy xuống Service để xử lý lấy thẻ mới
    tokens = await refresh_access_token(db, refresh_token)
    return tokens