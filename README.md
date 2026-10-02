# AI Mock Interview Studio

A production-quality, **local-first** desktop/web application for interview preparation that simulates a complete company recruitment process.

## 🎯 Features

- **Local-First Architecture** - Runs completely offline with local LLMs (Ollama/llama.cpp)
- **5 Interview Rounds**: Aptitude, Coding, Group Discussion, HR/Technical Interview, Final Report
- **Dynamic Question Generation** - No fixed question banks; questions generated based on profile, resume, JD, and conversation history
- **Resume & JD Parsing** - Local PDF/DOCX/TXT parsing with structured extraction
- **Secure Code Execution** - Sandboxed coding environment with resource limits (Python, C, C++, Java)
- **Offline Speech Recognition** - Whisper/faster-whisper for voice interviews
- **Adaptive Difficulty** - Questions adjust based on performance
- **Detailed Reports** - Mistake analysis, recommendations, improvement plans
- **Optional Online Mode** - OpenRouter integration for cloud models

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              AI MOCK INTERVIEW              │
├─────────────────────────────────────────────┤
│  React / TypeScript Frontend                │
│  (Dashboard, Aptitude, Coding, GD, HR, Report)│
├─────────────────────────────────────────────┤
│  FastAPI Backend                            │
│  (Interview Engine, Question Generator,     │
│   Resume Analyzer, Answer Evaluator,        │
│   Coding Judge, Speech Processor,           │
│   Session Manager, Report Generator)        │
├─────────────────────────────────────────────┤
│  Local AI (Ollama / llama.cpp)              │
│  Local STT (Whisper / faster-whisper)       │
├─────────────────────────────────────────────┤
│  Local Data (SQLite + FAISS + Filesystem)   │
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Ollama (for local models) - https://ollama.ai
- FFmpeg (for audio processing)

### Windows Setup

```powershell
# Run as Administrator
.\scripts\setup_windows.ps1
```

### Linux/macOS Setup

```bash
chmod +x scripts/setup_linux.sh
./scripts/setup_linux.sh
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdir -p ../data/{resumes,audio,code,reports,questions,sessions}
python -c "from database import init_db; init_db()"
cp .env.example .env
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Ollama (for local models):**
```bash
ollama serve
ollama pull llama3.1:8b  # or your preferred model
```

## 🔧 Configuration

### Environment Variables (.env)

```env
OPENROUTER_API_KEY=          # Optional: for cloud models
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=sqlite:///./data/interview.db
MODEL_PROVIDER=ollama        # ollama or openrouter
LOCAL_MODEL=                 # Specific model to use
ENABLE_ONLINE_SEARCH=false   # Enable online question retrieval
SECRET_KEY=your-secret-key
```

### AI Provider Selection

- **Local Ollama** (Default) - Runs models locally via Ollama
- **OpenRouter** - Cloud models via OpenRouter API

Models are auto-detected. Recommended models based on hardware:
- 8GB RAM: 7B quantized models
- 16GB RAM: 7B-14B quantized models
- 32GB+ RAM: 14B-32B quantized models

## 📖 Usage

1. **Create Profile** - Enter your details, skills, experience, target role
2. **Upload Resume** - PDF/DOCX/TXT parsed locally for context-aware questions
3. **Add Job Description** (Optional) - Tailor questions to specific roles
4. **Configure Interview** - Select rounds, difficulty, question counts
5. **Start Mock Interview** - Go through all rounds:
   - **Aptitude**: Dynamic MCQ questions with adaptive difficulty
   - **Coding**: Monaco editor with local code execution
   - **Communication**: Voice-based GD with Whisper transcription
   - **HR**: Conversational AI interviewer with resume-aware follow-ups
6. **View Report** - Detailed analysis with mistakes, recommendations, improvement plan

## 📁 Project Structure

```
ai-mock-interview/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   └── context/          # React context providers
│   └── package.json
├── backend/                  # FastAPI + Python
│   ├── api/                  # REST API endpoints
│   ├── services/
│   │   ├── ai/               # AI provider abstractions
│   │   ├── aptitude/         # Aptitude question generation
│   │   ├── coding/           # Code execution & evaluation
│   │   ├── communication/    # Speech processing & GD
│   │   ├── hr/               # HR interviewer logic
│   │   ├── interview/        # Interview state machine
│   │   ├── resume/           # Resume parsing
│   │   └── reports/          # Report generation
│   ├── models/               # SQLAlchemy models
│   ├── database.py           # Database setup
│   └── main.py               # FastAPI app
├── data/                     # Local data storage
├── docker/                   # Docker configuration
├── scripts/                  # Setup scripts
└── README.md
```

## 🐳 Docker

```bash
cd docker
docker-compose up -d
```

## 🔒 Security

- All data stored locally
- No telemetry or external requests (unless OpenRouter enabled)
- Sandboxed code execution
- Input validation on all endpoints
- No secrets in codebase

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend linting
cd frontend
npm run lint
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/HARIRAJAN44/local_interview_ai/issues
- Check troubleshooting section above
- Verify all prerequisites are installed