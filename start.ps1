# NLP_Finder Start Script for Windows
# This script starts both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting NLP_Finder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is running
Write-Host "Checking Ollama status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Ollama is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Ollama is not running!" -ForegroundColor Red
    Write-Host "  Please start Ollama first: ollama serve" -ForegroundColor Yellow
    Write-Host ""
    $startOllama = Read-Host "Would you like to start Ollama now? (y/n)"
    if ($startOllama -eq "y") {
        Write-Host "Starting Ollama in a new window..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
        Start-Sleep -Seconds 3
    } else {
        Write-Host "Please start Ollama manually and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Starting Backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; python main.py"

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running on http://localhost:8000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Backend may not have started properly. Check the backend window for errors." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  NLP_Finder is starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "The application will open in separate terminal windows." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop the services." -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting a few seconds before opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✓ All services started successfully!" -ForegroundColor Green
Write-Host ""
