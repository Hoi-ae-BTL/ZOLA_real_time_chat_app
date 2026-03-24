from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Đường dẫn kết nối Database (được lấy giống với file seed.py và alembic.ini của bạn)
DATABASE_URL = "postgresql+asyncpg://chatapp_user:123456@localhost:5432/chatapp_db"

engine = create_async_engine(DATABASE_URL, echo=False)

# Khởi tạo nhà máy sản xuất Session (async_session) để export cho deps.py dùng
async_session = async_sessionmaker(engine, expire_on_commit=False)