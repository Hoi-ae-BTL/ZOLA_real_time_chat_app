import os
import secrets
from dotenv import load_dotenv
from passlib.context import CryptContext
# using the CryptContext in the passlib to handle the password
from datetime import datetime, timedelta, timezone
from jose import jwt


load_dotenv() # Tự động tìm và load các biến từ file .env

# make an instance of the CryptContext class, config it to let it use bcrypt hash algo
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Lấy Secret Key và Algorithm từ biến môi trường, có fallback để tránh lỗi nếu quên khai báo
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "zola-super-secret-key-change-this-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Thời hạn của thẻ thông hành: 30 min

def get_password_hash(password: str)->str:
    #hash the password to save to database
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str)->bool:
    # check if the plain password is the hash one
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str: #hàm này sẽ được gọi sau khi người dùng đăng nhập đúng tên tk + mk
    #data dict is the payload of the request
    #expires_delta: is the time the toke lives

    # create a copy of the payload, avoid modifying the real data
    to_encode = data.copy()
    
    # Thiết lập thời gian hết hạn cho Token
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire}) # Gắn hạn sử dụng vào payload
    
    # Đóng dấu mộc sinh ra chuỗi mã hóa JWT bằng Secret Key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    # Tạo ra chuỗi 32 byte mã hóa an toàn để dùng làm Refresh Token
    return secrets.token_urlsafe(32)