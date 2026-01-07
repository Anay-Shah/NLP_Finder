# NLP_Finder Setup Script for Windows
# This script sets up the backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NLP_Finder Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Found Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Node.js not found. Please install Node.js 16 or higher." -ForegroundColor Red
    exit 1
}

# Check Ollama
Write-Host "Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaCheck = ollama --version 2>&1
    Write-Host "✓ Ollama is installed" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Ollama not found. Please install from https://ollama.ai" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Setup backend
Set-Location -Path "$PSScriptRoot\backend"

if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Skipping creation." -ForegroundColor Yellow
}
else {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Setup frontend
Set-Location -Path "$PSScriptRoot\frontend"

Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure Ollama is running: ollama serve" -ForegroundColor White
Write-Host "2. Pull the embedding model: ollama pull nomic-embed-text" -ForegroundColor White
Write-Host "3. Run the start script: .\start.ps1" -ForegroundColor White
Write-Host ""

Set-Location -Path $PSScriptRoot
