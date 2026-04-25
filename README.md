# ZOLA Real-time Chat App

ZOLA Real-time Chat App là ứng dụng nhắn tin thời gian thực được xây dựng trong khuôn khổ bài tập lớn môn học API. Dự án hướng tới việc triển khai một hệ thống chat hiện đại theo mô hình tách biệt frontend và backend, đồng thời áp dụng các kỹ thuật phổ biến trong phát triển ứng dụng web như xác thực người dùng, quản lý dữ liệu với cơ sở dữ liệu quan hệ, giao tiếp qua REST API và cập nhật dữ liệu theo thời gian thực.

Thông qua dự án này, nhóm thực hiện tập trung vào việc xây dựng một hệ thống có cấu trúc rõ ràng, dễ mở rộng, dễ kiểm thử và phù hợp với yêu cầu học thuật của môn học. Ứng dụng không chỉ phục vụ mục tiêu minh họa về mặt giao diện và chức năng, mà còn thể hiện quy trình tổ chức mã nguồn, thiết kế API và triển khai kết nối giữa các thành phần trong một hệ thống full-stack.

---

## 1. Tổng quan dự án

ZOLA được phát triển với mục tiêu mô phỏng một nền tảng nhắn tin cơ bản, cho phép người dùng:

- Đăng ký và đăng nhập tài khoản
- Quản lý hồ sơ cá nhân
- Tạo và tham gia các cuộc trò chuyện
- Gửi tin nhắn văn bản theo thời gian thực
- Gửi ảnh và file trong cuộc trò chuyện
- Quản lý danh sách bạn bè

Về mặt kỹ thuật, dự án được chia thành hai phần độc lập:

- Backend chịu trách nhiệm xử lý nghiệp vụ, xác thực người dùng, giao tiếp với cơ sở dữ liệu và cung cấp API.
- Frontend chịu trách nhiệm hiển thị giao diện, tương tác với người dùng và kết nối tới backend để lấy dữ liệu hoặc gửi yêu cầu.

Việc tách frontend và backend thành hai module riêng giúp mã nguồn rõ ràng hơn, thuận tiện cho việc phát triển, bảo trì và phân công công việc trong nhóm.

---

## 2. Công nghệ sử dụng

Dự án sử dụng các công nghệ chính sau:

- Backend: FastAPI + PostgreSQL (`backend/`)
- Frontend: ReactJS + Vite (`frontend/`)

Ngoài ra, dự án còn khai thác các thư viện hỗ trợ phục vụ cho những mục đích như:

- Làm việc với cơ sở dữ liệu bất đồng bộ
- Xác thực và cấp phát JWT
- Upload file
- Giao tiếp thời gian thực bằng Web Socket
- Tổ chức giao diện và quản lý trạng thái phía client

---

## 3. Yêu cầu môi trường

Trước khi cài đặt và chạy dự án, cần chuẩn bị sẵn các công cụ sau:

- Python 3.10+
- Node.js 18+ và npm
- PostgreSQL

Khuyến nghị sử dụng các phiên bản ổn định của Python, Node.js và PostgreSQL để tránh lỗi phát sinh do không tương thích thư viện.

---

## 4. Cấu trúc thư mục

Mã nguồn của dự án được tổ chức theo cấu trúc chính như sau:

```text
ZOLA_real_time_chat_app/
├── backend/   # Mã nguồn backend sử dụng FastAPI và PostgreSQL
└── frontend/  # Mã nguồn frontend sử dụng ReactJS và Vite
```

### `backend/`

Thư mục backend chứa toàn bộ phần xử lý phía máy chủ, bao gồm:

- Định nghĩa các API endpoint
- Xử lý logic nghiệp vụ
- Kết nối và thao tác với cơ sở dữ liệu PostgreSQL
- Xác thực người dùng bằng JWT
- Xử lý upload ảnh, file và dữ liệu liên quan

### `frontend/`

Thư mục frontend chứa toàn bộ phần giao diện người dùng, bao gồm:

- Các trang chính của ứng dụng
- Các component giao diện
- Các hàm gọi API tới backend
- Phần cấu hình giao tiếp với server

---

## 5. Hướng dẫn thiết lập Backend

Phần backend chịu trách nhiệm cung cấp API cho toàn bộ hệ thống. Cần thực hiện đầy đủ các bước dưới đây trước khi chạy ứng dụng.

### Bước 1: Di chuyển vào thư mục `backend` và tạo môi trường ảo

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

### Bước 3: Cài đặt các thư viện cần thiết

```bash
pip install -r requirements.txt
```

Lệnh trên sẽ cài đặt toàn bộ các thư viện mà backend cần để khởi chạy, bao gồm framework API, thư viện kết nối cơ sở dữ liệu, công cụ xác thực và các gói hỗ trợ khác.

### Bước 4: Tạo file `.env` trong thư mục `backend`

Tạo file `.env` và cấu hình các biến môi trường cần thiết:

```env
DATABASE_URL=postgresql+asyncpg://chatapp_user:123456@localhost:5432/chatapp_db
JWT_SECRET_KEY=your_secret_key
```

Trong đó:

- `DATABASE_URL` là chuỗi kết nối tới cơ sở dữ liệu PostgreSQL
- `JWT_SECRET_KEY` là khóa bí mật dùng để ký và xác thực token

### Bước 5: Khởi chạy server

```bash
uvicorn app.main:app --reload
```

Sau khi chạy thành công:

- API base URL: `http://localhost:8000`
- API documentation: `http://localhost:8000/docs`

Tài liệu API tại `/docs` có thể được sử dụng để kiểm tra endpoint, gửi request trực tiếp và phục vụ quá trình demo hoặc kiểm thử chức năng.

---

## 6. Hướng dẫn thiết lập Frontend

Phần frontend là giao diện tương tác trực tiếp với người dùng. Sau khi backend đã được chuẩn bị, tiếp tục thiết lập frontend theo các bước sau.

### Bước 1: Di chuyển vào thư mục `frontend`

```bash
cd frontend
```

### Bước 2: Cài đặt các thư viện cần thiết

```bash
npm install
```

Lệnh này sẽ cài đặt toàn bộ dependency cần thiết để chạy giao diện người dùng.

### Bước 3: Tạo file `.env` trong thư mục `frontend`

```env
VITE_API_URL=http://localhost:8000
```

Biến môi trường này được sử dụng để xác định địa chỉ backend mà frontend sẽ gửi request tới trong quá trình chạy ứng dụng.

### Bước 4: Khởi chạy ứng dụng frontend

```bash
npm run dev
```

Sau khi chạy thành công:

- Frontend URL: `http://localhost:5173`

Khi truy cập địa chỉ trên bằng trình duyệt, người dùng có thể thao tác với giao diện của hệ thống và gửi request tới backend đang chạy ở cổng `8000`.

---

## 7. Thiết lập cơ sở dữ liệu

Phần này dành cho bước chuẩn bị PostgreSQL trước khi khởi chạy backend.

Tạo user và database trong PostgreSQL:

```sql
CREATE USER chatapp_user WITH PASSWORD '123456';
CREATE DATABASE chatapp_db OWNER chatapp_user;
```

Sau khi hoàn thành bước này, backend có thể sử dụng thông tin trong `DATABASE_URL` để kết nối đến cơ sở dữ liệu.

---

## 8. Quy trình khởi chạy dự án

Để chạy dự án đầy đủ trên máy local, có thể thực hiện theo trình tự sau:

1. Khởi tạo PostgreSQL và tạo database theo hướng dẫn ở phần trên.
2. Thiết lập và chạy backend tại cổng `8000`.
3. Thiết lập và chạy frontend tại cổng `5173`.
4. Truy cập ứng dụng từ trình duyệt tại `http://localhost:5173`.

Quy trình này giúp đảm bảo frontend có thể kết nối thành công tới backend trong quá trình đăng nhập, gọi API và nhận dữ liệu thời gian thực.

---

## 9. Mục đích học thuật của dự án

Trong phạm vi bài tập lớn môn học API, dự án ZOLA Real-time Chat App có ý nghĩa như một sản phẩm minh họa tổng hợp cho các nội dung đã học, bao gồm:

- Thiết kế và tổ chức RESTful API
- Kết nối ứng dụng với cơ sở dữ liệu quan hệ
- Xác thực và phân quyền người dùng bằng token
- Giao tiếp giữa frontend và backend trong mô hình client-server
- Xây dựng ứng dụng web có tính tương tác và cập nhật dữ liệu liên tục

Dự án đồng thời giúp nhóm rèn luyện kỹ năng phân tích yêu cầu, phân chia công việc, tổ chức mã nguồn và trình bày một sản phẩm phần mềm theo định hướng chuyên nghiệp hơn.

---

## 10. Ghi chú

- Backend chạy mặc định tại cổng `8000`
- Frontend chạy mặc định tại cổng `5173`
- Tài liệu kiểm thử API có sẵn tại `http://localhost:8000/docs`
- Cần đảm bảo PostgreSQL đang hoạt động trước khi khởi chạy backend

Trong quá trình chấm bài hoặc demo, nên khởi chạy backend trước, sau đó mới chạy frontend để tránh lỗi kết nối.
