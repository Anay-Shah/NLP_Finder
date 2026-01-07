# Quick Start Guide for NLP_Finder

## First Time Setup

1. **Install Prerequisites**:
   - Python 3.8+ (https://www.python.org/downloads/)
   - Node.js 16+ (https://nodejs.org/)
   - Ollama (https://ollama.ai)

2. **Install Ollama Model**:
   ```powershell
   ollama pull nomic-embed-text
   ```

3. **Run Setup Script**:
   ```powershell
   .\setup.ps1
   ```

## Starting the Application

Run the start script:
```powershell
.\start.ps1
```

This will:
- Check if Ollama is running
- Start the backend server (http://localhost:8000)
- Start the frontend server (http://localhost:3000)
- Open your browser automatically

## Manual Start (Alternative)

If you prefer to start services manually:

### Terminal 1 - Ollama:
```powershell
ollama serve
```

### Terminal 2 - Backend:
```powershell
cd backend
.\venv\Scripts\Activate
python main.py
```

### Terminal 3 - Frontend:
```powershell
cd frontend
npm run dev
```

## Using the Application

1. **Index a Directory**:
   - Enter the full path (e.g., `C:\Users\YourName\Documents\Projects`)
   - Click "Start Indexing"
   - Wait for completion

2. **Search**:
   - Type a natural language query
   - Press Enter or click Search
   - Click results to preview files

3. **Actions**:
   - Click "Open" to open the file
   - Click "Reveal" to show in file explorer

## Troubleshooting

**Ollama not running**:
```powershell
ollama serve
```

**Backend not starting**:
- Check Python is in PATH
- Activate venv: `cd backend; .\venv\Scripts\Activate`
- Install deps: `pip install -r requirements.txt`

**Frontend not starting**:
- Check Node.js is in PATH
- Install deps: `cd frontend; npm install`

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop the services.

---

For detailed documentation, see README.md
