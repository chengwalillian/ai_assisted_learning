# AI-Powered Adaptive Learning System

A learning platform that adapts to each student's level using AI-powered feedback. Students get personalized quizzes and instant explanations. Teachers can monitor class progress and identify students needing support.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL (Aiven) |
| AI | Groq API |

---

## Prerequisites

- Node.js + npm
- Python 3.11+
- Git

**Free accounts needed:**
- [Aiven PostgreSQL](https://aiven.io) - Free tier
- [Groq](https://groq.com) - Free API credits

---

## Quick Start

```bash
# 1. Clone the project
git clone https://github.com/Aineah-Simiyu/Ai-Adapative-learning.git
cd Adaptive_Learning_Platform

# 2. Set up environment
cp .env.example .env
# Edit .env with your Aiven URL and Groq key

# 3. Start backend
cd Backend
uvicorn app.main:app --reload

# 4. Start frontend (new terminal)
cd ../Frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

---

## Project Structure

```
Adaptive_Learning_Platform/
├── Frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/    # HomePage, StudentPage, TeacherPage
│   │   ├── components/ # QuizInterface, AnalyticsDashboard
│   │   └── api/      # API client
│   └── package.json
│
├── Backend/           # FastAPI
│   ├── app/          # Main application
│   ├── services/     # AI + Analytics services
│   └── services/
│
└── .env              # Environment variables
```

---

## Environment Variables

Create `.env` file in root:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/dbname
GROQ_API_KEY=your_groq_key_here
```

---

## Key Features

**Students:**
- Create account / Login
- Select topic + difficulty
- Get AI-generated questions
- Instant feedback with explanations
- Track progress

**Teachers:**
- View all students
- Filter by performance
- See topic-by-topic breakdown
- Quiz history per student
- Identify struggling students

---

## API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/students` | Create student |
| POST | `/quiz/submit` | Submit answer + get AI feedback |
| POST | `/quiz/generate-question` | Get new question |
| GET | `/analytics/class-summary` | Class statistics |
| GET | `/analytics/struggling-students` | Students below threshold |
| GET | `/analytics/quiz-history/{id}` | Student's quiz history |

---

## Database Schema

### Students Table
- id, name, email, joined_at

### Quiz Results Table
- id, student_id, topic, difficulty, question, student_answer, correct_answer, is_correct, time_taken_seconds, ai_feedback, created_at

### Performance History Table
- Summarized per student per topic

---

## Running in Production

```bash
# Backend
cd Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd Frontend
npm run build
# Deploy the dist/ folder
```

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework
- [React](https://react.dev) - UI library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Groq](https://groq.com) - AI inference
- [Aiven](https://aiven.io) - Managed PostgreSQL

---