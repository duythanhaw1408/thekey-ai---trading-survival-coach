# THEKEY AI - Trading Survival Coach

Hệ thống hỗ trợ giao dịch thông minh giúp rèn luyện kỷ luật, quản lý vốn và theo dõi tâm lý giao dịch thời gian thực.

## 🚀 Cấu trúc dự án

-   **Frontend**: React (Vite) + Framer Motion + TypeScript.
-   **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Supabase).
-   **AI**: Google Gemini Pro (Trade evaluation, Sentiment analysis).

---

## 🛠️ Hướng dẫn cài đặt & Chạy máy local

### 1. Cài đặt Frontend
1. Truy cập thư mục gốc: `cd /Users/nguyenduythanh/Downloads/thekey-ai---trading-survival-coach`
2. Cài đặt thư viện: `npm install`
3. Cấu hình file `.env` (xem mục Cấu hình bên dưới).
4. Chạy: `npm run dev` (mặc định port 3000).

### 2. Cài đặt Backend
1. Truy cập thư mục backend: `cd backend`
2. Tạo môi trường ảo: `python3 -m venv venv`
3. Kích hoạt môi trường ảo: `source venv/bin/activate`
4. Cài đặt thư viện: `pip install -r requirements.txt`
5. Cấu hình file `backend/.env`.
6. Chạy backend: `./venv/bin/python3 -m uvicorn main:app --reload --port 8000`

---

## ⚙️ Cấu hình Biến môi trường (.env)

Bạn **BẮT BUỘC** phải giữ lại các file sau khi sao lưu:

### Frontend (`.env` tại thư mục gốc)
- `VITE_GEMINI_API_KEY`: API Key cho Gemini (AI).
- `VITE_BACKEND_URL`: URL API backend (mặc định `http://localhost:8000`).

### Backend (`backend/.env`)
- `DATABASE_URL`: Link kết nối Supabase PostgreSQL.
- `GEMINI_API_KEY`: API Key cho Gemini backend.
- `JWT_SECRET`: Chuỗi bí mật để mã hóa token đăng nhập.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Cấu hình Google Login.

---

## 📦 Cách đóng gói để lưu trữ (Backup)

Để tạo một bản backup sạch (không bao gồm thư viện nặng), chạy lệnh sau:

```bash
zip -r thekey_ai_backup.zip . -x "**/node_modules/*" "**/venv/*" "**/__pycache__/*" "**/.git/*" "**/.next/*"
```

Tệp `thekey_ai_backup.zip` sẽ chứa toàn bộ code và cấu hình cần thiết để chạy lại ở máy khác.

---

## 💾 Dữ liệu (Database)
Hiện tại hệ thống sử dụng **Supabase Cloud**. Toàn bộ dữ liệu người dùng, lệnh giao dịch và XP đều được lưu an toàn trên Cloud của Supabase. Bạn chỉ cần giữ lại biến `DATABASE_URL` trong file `backend/.env` là có thể truy cập lại dữ liệu từ bất kỳ đâu.
