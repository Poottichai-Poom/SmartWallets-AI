# SmartWallets-AI

An AI-powered personal finance management application.

## 🚀 Tech Stack

- **Frontend:** [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/) (Powered by [Vite](https://vitejs.dev/))
- **Backend:** [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/) & [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Containerization:** [Docker](https://www.docker.com/) & Docker Compose

## 📂 Project Structure

```text
.
├── backend/              # Express API (TypeScript)
│   ├── prisma/           # Database schema & migrations
│   ├── src/              # Application source code
│   └── Dockerfile        # Backend container config
├── frontend/             # React App (Vite + TS)
│   ├── src/              # React components & logic
│   └── Dockerfile        # Frontend container config (Nginx)
├── docker-compose.yml    # Orchestrates services (DB, API, Web)
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Node.js](https://nodejs.org/) (Optional, if you want to run services locally without Docker).

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SmartWallets-AI
   ```

2. **Start the application using Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   This command will:
   - Start a PostgreSQL database.
   - Build and start the Backend API.
   - Build and start the Frontend application.

3. **Access the application:**
   - **Frontend:** [http://localhost](http://localhost)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)
   - **Health Check:** [http://localhost:3001/health](http://localhost:3001/health)

## 🔧 Local Development

If you prefer to run services outside of Docker:

### Backend
```bash
cd backend
npm install
# Update .env with your local DB URL
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📜 License
This project is licensed under the ISC License.
