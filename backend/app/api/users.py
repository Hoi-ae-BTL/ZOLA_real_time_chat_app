from fastapi import APIRouter
from typing import List
from backend.app.schemas.user import UserCreate, UserResponse, UserUpdate

# Tạo nhóm API Tài khoản
router = APIRouter(prefix="/api/users", tags=["Users & Auth (Tài khoản)"])


@router.post("/register", response_model=UserResponse)
async def register_user(data: UserCreate):
    """
    **API Đăng ký tài khoản mới**

    - Frontend truyền lên mật khẩu gốc (password),
    Backend sẽ tự động băm (hash) trước khi lưu.
    """
    pass


@router.get("/me", response_model=UserResponse)
async def get_my_profile():
    """
    **API Lấy thông tin cá nhân của chính mình**

    - API này cần Token đăng nhập. Lấy data dựa trên người đang cầm Token.
    """
    pass


@router.put("/me", response_model=UserResponse)
async def update_my_profile(data: UserUpdate):
    """
    **API Cập nhật hồ sơ (Đổi tên, Avatar, Bio...)**
    """
    pass