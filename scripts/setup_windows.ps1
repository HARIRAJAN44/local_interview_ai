<# 
.SYNOPSIS
    AI Mock Interview Studio - Windows Setup Script

.DESCRIPTION
    This script sets up the AI Mock Interview Studio on Windows.
    It checks prerequisites, creates virtual environment, installs dependencies,
    initializes database, and builds the frontend.

.NOTES
    Run this script as Administrator for best results.
#>

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AI Mock Interview Studio - Windows Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check Python
Write-Host "`nChecking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python 3.11+ is required. Install from https://python.org" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Found Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js 18+ is required. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Ollama
Write-Host "`nChecking Ollama..." -ForegroundColor Yellow
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "Ollama found" -ForegroundColor Green
    ollama list
} else {
    Write-Host "WARNING: Ollama not found. Please install from https://ollama.ai" -ForegroundColor Yellow
    Write-Host "You can still use OpenRouter as an alternative." -ForegroundColor Yellow
}

# Check FFmpeg
Write-Host "`nChecking FFmpeg..." -ForegroundColor Yellow
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Write-Host "FFmpeg found" -ForegroundColor Green
} else {
    Write-Host "WARNING: FFmpeg not found. Audio processing may not work." -ForegroundColor Yellow
    Write-Host "Install from https://ffmpeg.org or use: winget install ffmpeg" -ForegroundColor Yellow
}

# Check GPU
Write-Host "`nChecking GPU..." -ForegroundColor Yellow
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
} else {
    Write-Host "No NVIDIA GPU detected or nvidia-smi not available" -ForegroundColor Yellow
}

# Create virtual environment
Write-Host "`nCreating Python virtual environment..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

# Install Python dependencies
Write-Host "`nInstalling Python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install --upgrade pip
& ".\venv\Scripts\pip.exe" install -r requirements.txt

# Initialize database
Write-Host "`nInitializing database..." -ForegroundColor Yellow
$dirs = @("..\data\resumes", "..\data\audio", "..\data\code", "..\data\reports", "..\data\questions", "..\data\sessions")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
& ".\venv\Scripts\python.exe" -c "from database import init_db; init_db()"
Write-Host "Database initialized" -ForegroundColor Green

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
npm install

# Build frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
npm run build

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Green
Write-Host "1. Start Ollama (if using local models): ollama serve" -ForegroundColor White
Write-Host "2. Start backend: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn main:app --reload" -ForegroundColor White
Write-Host "3. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker: docker-compose -f docker\docker-compose.yml up" -ForegroundColor White