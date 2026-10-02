#!/bin/bash
set -e

echo "========================================="
echo "AI Mock Interview Studio - Linux Setup"
echo "========================================="

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3.11+ is required"
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Found Python $PYTHON_VERSION"

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js 18+ is required"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "Found Node.js $NODE_VERSION"

# Check Ollama
echo "Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "WARNING: Ollama not found. Please install from https://ollama.ai"
    echo "You can still use OpenRouter as an alternative."
else
    echo "Ollama found"
    ollama list
fi

# Check FFmpeg
echo "Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo "WARNING: FFmpeg not found. Audio processing may not work."
else
    echo "FFmpeg found"
fi

# Check GPU
echo "Checking GPU..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "No NVIDIA GPU detected or nvidia-smi not available"
fi

# Create virtual environment
echo "Creating Python virtual environment..."
cd "$(dirname "$0")/../backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
mkdir -p ../data/resumes ../data/audio ../data/code ../data/reports ../data/questions ../data/sessions
python3 -c "from database import init_db; init_db()"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

echo ""
echo "========================================="
echo "Setup complete!"
echo "========================================="
echo ""
echo "To start the application:"
echo "1. Start Ollama (if using local models): ollama serve"
echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker: docker-compose -f docker/docker-compose.yml up"