# SmartWallets-AI

ระบบจัดการการเงินส่วนตัวด้วย AI — อัปโหลด PDF สเตทเมนต์จากธนาคาร วิเคราะห์รายรับ/รายจ่าย และรับคำแนะนำทางการเงินจาก AI

## Tech Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** JSON file store (`backend/data/db.json`)
- **AI:** Ollama (local) with `gemma3` model
- **PDF Encryption:** AES-256-GCM

## Project Structure

```
SmartWallets-AI/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic (PDF, AI, transactions)
│   │   ├── routes/          # API routes
│   │   ├── middleware/       # Auth, upload, rate limiting
│   │   └── db/              # JSON store models
│   ├── data/db.json         # Database (JSON)
│   ├── uploads/             # Encrypted PDF files
│   └── .env                 # Environment variables
├── frontend/
│   └── src/
│       ├── pages/           # UploadPage, DashboardPage, etc.
│       ├── components/      # UI components
│       └── api/             # API client functions
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.com/) พร้อม model `gemma3`

### 1. ติดตั้ง Ollama และ model

```bash
# ติดตั้ง Ollama (macOS)
brew install ollama

# ดาวน์โหลด model
ollama pull gemma3

# รัน Ollama (ต้องรันไว้ตลอดเวลา)
ollama serve
```

### 2. Backend

```bash
cd backend
npm install
# สร้างไฟล์ .env (ดูตัวอย่างด้านล่าง)
npm run dev
```

**ตัวอย่าง `.env`:**
```env
PORT=3002
JWT_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
ENCRYPTION_MASTER_KEY=<64-char-hex>
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3
PDF_ACCESS_SESSION_MINUTES=30
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
CORS_ORIGIN=http://localhost:5173
DB_FILE=./data/db.json
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

เปิด [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/pdf` | อัปโหลด PDF |
| POST | `/api/pdf/:id/analyze` | วิเคราะห์ PDF ด้วย AI |
| GET | `/api/transactions` | ดูรายการธุรกรรม |
| GET | `/api/analysis/summary` | สรุปรายรับ/รายจ่ายรายเดือน |
| GET | `/api/analysis/recommendations` | คำแนะนำจาก AI |

## รองรับธนาคาร

SCB · KBank · KTB · BBL · BAY · ttb

## License

ISC
