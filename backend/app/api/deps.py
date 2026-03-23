from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

# Import session maker từ file cấu hình Database của bạn (có thể bạn đã tạo ở db/session.py)
# Lưu ý: Tên 'async_session' ở đây phải khớp với tên biến bạn khởi tạo async_sessionmaker trong session.py
from backend.app.db.session import async_session 

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency để lấy Database Session cho mỗi API request.
    Nó sẽ mở kết nối khi request bắt đầu, và tự động đóng khi request kết thúc.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()