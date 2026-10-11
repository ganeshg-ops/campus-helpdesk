# Campus Helpdesk – AI-Powered Student & Administration Portal

**Campus Helpdesk** is an enterprise-grade, role-based AI helpdesk web application for colleges and universities. It features two distinct, secure portals: an intuitive **Student Portal** with document-grounded AI chat, and a robust **Admin Portal** for official college document management (PDF chunking, indexing, and OCR detection) and student email dispatch management.

---

## 🌟 Key Features

### 1. Two Independent, Secure Portals
* **Student Portal (`/student/*`)**:
  - Secure role-based student authentication (`/student/login` and `/student/register`).
  - Welcome greeting with student name.
  - Large **"Ask Campus AI"** chat window.
  - Quick-start suggested questions:
    - *How can I apply for a bonafide certificate?*
    - *What documents are required for a bonafide certificate?*
    - *What are the attendance rules?*
    - *Where can I find examination information?*
    - *What is the procedure for applying for a leave letter?*
  - **My Previous Questions** drawer to view and reload past chat sessions.
  - Direct **Contact Admin** option and clear **Logout**.
* **Admin Portal (`/admin/*`)**:
  - Strict role-based backend authorization (`require_staff_or_admin`, `require_admin`). Students cannot access admin routes or APIs.
  - **Command Center Dashboard** with:
    - Total Uploaded PDFs counter.
    - Student Emails & Support Requests counter.
    - Unanswered Questions metric.
    - PDF Upload & Knowledge Processing status.
    - Recent Student Questions feed.
  - **Knowledge & PDF Management**:
    - Upload college PDF rules, guidelines, fees, and examination schedules.
    - Automatic page-by-page text extraction and semantic chunking.
    - Instant Scanned PDF / OCR-required warning detection.
    - Replace, Reprocess, and Delete documents (with automatic RAG vector index purging).
  - **Student Messages / Contact Admin Inbox**:
    - Centralized view of all email inquiries submitted by students.
    - Filter by status: `New`, `In Progress`, `Resolved`.
    - Modal/drawer to inspect original student questions, AI context, and timestamps.
    - Built-in email reply tool directly dispatching replies to students.

### 2. Document-Grounded AI & Strict Anti-Hallucination Guardrails
* Answers are strictly synthesized from admin-uploaded college PDFs.
* Each grounded answer includes official source PDF citations and exact page numbers.
* **Strict Missing Information Fallback**: If an answer is not found in the uploaded documents, the AI will never fabricate rules or dates. Instead, it responds with:
  > *"I couldn't find the exact information in the college documents available to me. Please contact the college admin for confirmation. You can send your question to the admin using the Contact Admin option below."*
* Renders two prominent action buttons on missing info:
  - **Email Admin**: Opens pre-filled email contact modal.
  - **Ask Another Question**: Clears input to try a different query.

### 3. Email Admin Workflow
* Pre-fills student name, email, and current question automatically.
* Allows student to add custom notes and optional conversation context.
* Transmits to configured administrator email (`ADMIN_EMAIL`) via transactional SMTP with verified dev/simulation fallback.
* Confirms delivery only after email service confirmation; records failures with single-click retry.

---

## 🏗️ Technology Architecture

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router v6.
* **Backend**: Python 3.10+ / 3.14, FastAPI, SQLAlchemy, Pydantic v2, PyPDF / PyMuPDF (fitz), JWT authentication (`python-jose`, `passlib`).
* **Database**: SQLite (default zero-config development) / PostgreSQL (production deployment).
* **AI & RAG Engine**: Retrieval-Augmented Generation with local TF-IDF cosine vector store fallback and optional OpenAI / Google Gemini LLM API integration.
* **Email Dispatcher**: Configurable transactional SMTP client with verified simulation fallback.

---

## 🚀 Quickstart Guide

### Prerequisites
* Python 3.10 or higher
* Node.js v18+ and npm

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run database migrations / seed initial sample data
python -c "from app.database import engine, Base; from app.seed_data import seed_database; from app.database import SessionLocal; Base.metadata.create_all(bind=engine); db = SessionLocal(); seed_database(db); db.close()"

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and Swagger docs will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The web portal will open at `http://localhost:5173`.

---

## 🧪 Automated Testing
Run the comprehensive 18-scenario test suite verifying:
- Student vs Admin authentication and role boundaries.
- PDF upload, text extraction, page tracking, chunking, and index updates.
- Grounded AI response generation with PDF name and page citations.
- Exact missing information fallback behavior.
- Email admin submission, database persistence, and admin reply workflow.
- Scanned PDF / OCR detection.

```bash
cd backend
python -m pytest
```

---

## 🔒 Security & Access Control
1. **Role Enforcement**: Student accounts are strictly restricted to role `"student"`. Admin routes reject student tokens with `403 Forbidden`.
2. **Data Isolation**: Students can only access their own private conversations and message histories.
3. **Password Security**: Passwords hashed with BCrypt and authenticated via JWT bearer tokens.
4. **File Safety**: PDF uploads restricted to `.pdf` extensions and validated prior to extraction.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Root directory: `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set environment variable: `VITE_API_BASE_URL=https://your-backend-api.onrender.com`.

### Backend (Render / Railway / Fly.io)
1. Deploy from repository root with directory `backend`.
2. Build command: `pip install -r requirements.txt`.
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Set production environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. Supabase or Render Postgres).
   - `ADMIN_EMAIL`: Official college administrative inbox address.
   - `SECRET_KEY`: Strong randomized secret string.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Production transactional email SMTP credentials (e.g., SendGrid, Mailgun, Amazon SES).
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`: API key for generative response synthesis.
