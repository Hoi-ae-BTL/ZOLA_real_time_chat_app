from fastapi import APIRouter, Depends, HTTPException, Query, status
from backend.app.schemas.user import UserCreate, UserResponse, UserUpdate
from backend.app.crud.crud_user import (
    create_user,
    get_user_by_email,
    get_user_by_username,
    search_users,
)
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import get_db, get_current_user
from backend.app.db.base import User

# Tạo nhóm API Tài khoản
router = APIRouter(prefix="/api/users", tags=["Users & Auth (Tài khoản)"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # biến db là một session với database postgres
    """
    **API Đăng ký tài khoản mới**

    - Frontend truyền lên mật khẩu gốc (password),
    Backend sẽ tự động băm (hash) trước khi lưu.
    """
    # Bước 1: Kiểm tra riêng biệt từng trường hợp
    if await get_user_by_username(db, username=data.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username đã tồn tại")
        
    if data.email and await get_user_by_email(db, email=data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã tồn tại")
        
    # Bgước 2: Tạo user mới và trả về object (FastAPI tự động ép kiểu san UserResponse)
    new_user = await create_user(db, obj_in=data)
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    **API Lấy thông tin cá nhân của chính mình**

    - API này cần Token đăng nhập. Lấy data dựa trên người đang cầm Token.
    """
    return current_user


@router.get("/search", response_model=list[UserResponse])
async def search_users_route(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await search_users(
        db,
        query=q,
        exclude_user_id=current_user.id,
        limit=limit,
    )


@router.put("/me", response_model=UserResponse)
async def update_my_profile(data: UserUpdate):
    """
    **API Cập nhật hồ sơ (Đổi tên, Avatar, Bio...)**
    """
    pass
