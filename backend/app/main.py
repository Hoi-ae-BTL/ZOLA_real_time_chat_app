from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Import các Router từ thư mục app/api/
from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as user_router
from backend.app.api.friends import router as friend_router
from backend.app.api.conversations import router as conv_router
from backend.app.api.messages import router as msg_router

# 2. Khởi tạo ứng dụng FastAPI với thông tin tài liệu Swagger UI
app = FastAPI(
    title="ZOLA Chat App API 🚀",
    description="Tài liệu API chính thức. Giao tiếp giữa Frontend và Backend.",
    version="1.0.0",
    docs_url="/docs",   # Đường dẫn mặc định của Swagger UI
    redoc_url="/redoc"  # Đường dẫn của ReDoc (Một kiểu giao diện tài liệu khác)
)

# ---------------------------------------------------------
# 3. CẤU HÌNH CORS (Mở cửa cho Frontend gọi vào Server)
# ---------------------------------------------------------
# Khai báo các địa chỉ được phép gọi API (Frontend của Thế chạy ở đâu thì điền vào đây)
origins = [
    "http://localhost:3000",  # Nếu Thế code bằng React/NextJS (mặc định)
    "http://localhost:5173",  # Nếu Thế khởi tạo bằng Vite
    "*"                       # TẠM THỜI mở cho tất cả (Lưu ý: Lúc chấm đồ án/đưa lên mạng thật thì nên xóa dòng này)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Bắt buộc là True nếu có dùng Token đăng nhập/Cookie
    allow_methods=["*"],    # Cho phép tất cả GET, POST, PUT, DELETE...
    allow_headers=["*"],    # Cho phép gửi mọi loại Header (Quan trọng nhất là Header Authorization chứa Token)
)

# ---------------------------------------------------------
# 4. LẮP RÁP CÁC MODULE API TĨNH (Phần việc của Hưng)
# ---------------------------------------------------------
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(friend_router)
app.include_router(conv_router)
app.include_router(msg_router)

# Chừa sẵn chỗ cho phần Real-time của Hà (Sẽ làm ở bước sau)
# from app.websockets.hub import router as websocket_router
# app.include_router(websocket_router)

# ------------------------------------- --------------------
# 5. API KIỂM TRA SỨC KHỎE SERVER (Health Check)
# ---------------------------------------------------------
@app.get("/", tags=["Trang chủ"])
async def root():
    """
    **Endpoint mặc định để kiểm tra xem Server có đang sống hay không.**
    """
    return {
        "status": "success",
        "message": "ZOLA Server đang chạy ngon lành! 🔥",
        "docs": "Mở trình duyệt truy cập http://localhost:8000/docs để xem tài liệu API"
    }