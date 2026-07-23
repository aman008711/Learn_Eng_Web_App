# Jarvis AI English Coach

Jarvis AI English Coach is a commercial-grade, gamified AI SaaS web application designed to help users improve their English speaking, grammar, and vocabulary skills. By integrating advanced Large Language Models, Whisper Speech-to-Text, and ElevenLabs Text-to-Speech, Jarvis acts as an interactive personal voice coach.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS (Premium glassmorphic templates)
* **State Management**: Zustand
* **Routing**: React Router DOM (With protected session gates)
* **API Client**: Axios (With automated silent JWT refresh interceptors)
* **Data Fetching**: TanStack Query (React Query)
* **Forms & Validation**: React Hook Form, Zod

### Backend
* **Core Framework**: Python, FastAPI
* **Database Mapping (ORM)**: SQLAlchemy
* **Request/Response Validation**: Pydantic v2
* **Authentication**: JWT (Access and Refresh token rotation models)
* **Security & Salting**: Passlib, bcrypt
* **Migrations**: Alembic

### Database & Third-Party APIs
* **Database**: Supabase PostgreSQL
* **Speech-to-Text (STT)**: OpenAI Whisper API
* **Large Language Models**: Google Gemini / OpenAI GPT
* **Text-to-Speech (TTS)**: ElevenLabs API
* **Cloud Audio Storage**: Supabase Object Storage

---

## 🏗️ Project Architecture & Decoupling

The codebase is built following **Clean Architecture** patterns, isolating application logic from external database systems, API vendors, and interface views.

* **Presentation Layer (Frontend / Routers)**: Handles UI forms and HTTP request entries.
* **Core Domain Layer (Services / Security)**: Orchestrates conversation generation, score cards, and JWT creation/verification.
* **Infrastructure Layer (Repositories / Models)**: Direct SQL transactions and connections to API providers.

---

## 📁 Directory Structure

```text
/ (Workspace Root)
├── backend/                       # FastAPI Server Architecture
│   ├── app/
│   │   ├── api/                   # Router endpoints and dependencies injection
│   │   ├── core/                  # Security utilities & business logic services
│   │   ├── db/                    # SQLAlchemy models, sessions, and Repository modules
│   │   ├── schemas/               # Input/Output Pydantic validations
│   │   └── main.py                # Server entrypoint & CORS middleware setup
│   ├── requirements.txt           # Python packages listing
│   └── .env.example               # Backend environment variables template
│
└── frontend/                      # React Client Architecture
    ├── src/
    │   ├── components/            # Reusable presentational widgets
    │   ├── features/              # Modularized dashboard & auth page segments
    │   ├── hooks/                 # Web Audio custom hooks
    │   ├── lib/                   # Network client setup (Axios interceptor)
    │   ├── store/                 # Global Zustand state stores
    │   ├── types/                 # Type declaration files
    │   ├── App.tsx                # Page layouts & router gates
    │   ├── index.css              # Custom styling tokens
    │   └── main.tsx               # DOM mount entrypoint
    ├── tailwind.config.js         # Design tokens configurations
    ├── tsconfig.json              # TypeScript options
    └── package.json               # Frontend dependencies listing
```

---

## 🚀 Getting Started

Ensure you have **Python 3.12+** and **Node.js 18+** installed.

### 1. Database Setup (Supabase)
Create a new PostgreSQL database on [Supabase](https://supabase.com). Ensure you take note of your **PostgreSQL Connection String**.

### 2. Backend Installation & Startup

1. Open your terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment secrets:
   * Copy `.env.example` to `.env`.
   * Open `.env` and fill in your connection string under `DATABASE_URL` along with your API credentials (OpenAI, Gemini, ElevenLabs).
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The server runs at `http://localhost:8000`.
   * Access the interactive API Swagger docs at `http://localhost:8000/api/v1/docs`.

### 3. Frontend Installation & Startup

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Configure environment parameters:
   * Copy `.env.example` to `.env`.
   * Ensure `VITE_API_URL` is pointing to your backend address: `http://localhost:8000`.
4. Start the Vite client application:
   ```bash
   npm run dev
   ```
   * The application starts at `http://localhost:5173`. Open this URL in your web browser.

---

## 💡 Developer Sandbox & Verification
The dashboard contains a **Developer Sandbox** widget inside the *Quick Actions* panel:
* Click **Simulate Speaking Activity** to dynamically post a mock learning event.
* This executes a database transaction that updates XP, increments study time completed, automatically advances levels (every 1000 XP threshold), logs custom achievements in the timeline, and updates the circular progress metrics in real-time.
