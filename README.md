# ZOLA Real-time Chat App

Ứng dụng nhắn tin thời gian thực.

- Backend: FastAPI + PostgreSQL (`backend/`)
- Frontend: ReactJS + Vite (`frontend/`)

---

## 1. Prerequisites

- Python 3.10+
- Node.js 18+ và npm
- PostgreSQL

---

## 2. Backend Setup

### Bước 1: Vào thư mục backend và tạo môi trường ảo

```bash
cd backend
python -m venv venv
```

### Bước 2: Kích hoạt môi trường ảo

**macOS / Linux (Bash/Zsh)**

```bash
source venv/bin/activate
```

**Windows (PowerShell)**

```bash
.\venv\Scripts\Activate.ps1
```

### Bước 3: Cài đặt thư viện

```bash
pip install -r requirements.txt
```

### Bước 4: Tạo file `.env` trong thư mục `backend`

```env
DATABASE_URL=postgresql+asyncpg://chatapp_user:123456@localhost:5432/chatapp_db
JWT_SECRET_KEY=your_secret_key
```

### Bước 5: Chạy server

```bash
uvicorn main:app --reload
```

API chạy tại:

```
http://localhost:8000
```

Tài liệu API:

```
http://localhost:8000/docs
```

---

## 3. Frontend Setup


### Bước 1: Vào thư mục frontend

```bash
cd frontend
```

### Bước 2: Cài đặt thư viện

```bash
npm install
```

### Bước 3: Tạo file `.env` trong thư mục `frontend`

```env
VITE_API_URL=http://localhost:8000
```

### Bước 4: Chạy frontend

```bash
npm run dev
```

Frontend chạy tại:

```
http://localhost:5173
```

---

## 4. Database Setup

Dành cho: Tuấn

Tạo user và database trong PostgreSQL:

```sql
CREATE USER chatapp_user WITH PASSWORD '123456';
CREATE DATABASE chatapp_db OWNER chatapp_user;
```