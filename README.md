# 🔎 NLP_Finder

**Local Semantic File Search powered by Ollama**

NLP_Finder is a cross-platform desktop application that enables you to perform natural language searches over your local files using a completely local AI model. No cloud services, no external APIs—everything runs on your machine.

---

## 🎯 Features

### Core Functionality
- 🔍 **Natural Language Search** - Search files using conversational queries
- 🤖 **100% Local AI** - All processing happens on your machine via Ollama
- 📂 **Multiple File Types** - Supports `.txt`, `.md`, `.pdf`, `.py`, `.js`, `.ts`, `.html`, `.css`, `.json`, and more
- ⚡ **Fast Semantic Search** - Find files by meaning, not just keywords
- 🎯 **Smart Ranking** - Results sorted by semantic similarity scores
- 👁️ **File Preview** - View file contents with highlighted matches
- 📍 **System Integration** - Open files or reveal in file explorer

### Technical Highlights
- **Vector Search**: FAISS-based similarity search
- **Embeddings**: Local text embeddings via Ollama
- **Chunking**: Intelligent text chunking for large files
- **Cross-Platform**: Works on Windows and macOS
- **Modern UI**: Clean, developer-focused React interface
- **Dark Mode**: Eye-friendly dark theme

---

## 🛠️ Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern async web framework
- **FAISS** - Vector similarity search
- **Ollama** - Local LLM inference
- **PyPDF2** - PDF text extraction

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - API client

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### 1. Python 3.8 or higher
```powershell
# Check Python version
python --version
```

### 2. Node.js 16 or higher
```powershell
# Check Node.js version
node --version
```

### 3. Ollama
Download and install from [ollama.ai](https://ollama.ai)

**Windows**: Download the installer from the website  
**macOS**: 
```bash
brew install ollama
```

### 4. Required Ollama Models
After installing Ollama, pull the required embedding model:

```powershell
# Start Ollama (if not already running)
ollama serve

# In a new terminal, pull the embedding model
ollama pull nomic-embed-text

# Optional: Pull an LLM for enhanced features (optional)
ollama pull llama3
```

---

## 🚀 Installation & Setup

### Step 1: Clone or Download the Project

Navigate to the project directory:
```powershell
cd "C:\Users\AnayShah\Documents\Coding Projects\NLP_Finder"
```

### Step 2: Set Up the Backend

```powershell
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Set Up the Frontend

```powershell
# Navigate to frontend directory (from project root)
cd ..\frontend

# Install dependencies
npm install
```

---

## ▶️ Running the Application

You need to run **three** separate processes:

### Terminal 1: Start Ollama (if not already running)

```powershell
ollama serve
```

Leave this running. Ollama will be available at `http://localhost:11434`

### Terminal 2: Start the Backend

```powershell
cd backend
.\venv\Scripts\Activate
python main.py
```

The backend API will start at `http://localhost:8000`

### Terminal 3: Start the Frontend

```powershell
cd frontend
npm run dev
```

The frontend will start at `http://localhost:3000`

### Open Your Browser

Navigate to: **http://localhost:3000**

---

## 📖 How to Use

### 1. Index a Directory

1. Enter the full path to a directory you want to search
   - Example: `C:\Users\YourName\Documents\Projects`
2. Click **"Start Indexing"**
3. Wait for the indexing process to complete
4. You'll see progress updates and the total number of files indexed

### 2. Search for Files

1. Type a natural language query in the search box
   - Example: "functions that handle user authentication"
   - Example: "documentation about API endpoints"
   - Example: "code that processes payment transactions"
2. Press **Enter** or click **"Search"**
3. Results will appear sorted by relevance

### 3. View File Details

1. Click on any search result to view its contents
2. Switch between **"Full Content"** and **"Matched Section"** tabs
3. Matched keywords are highlighted in yellow
4. Use the action buttons to:
   - **Open**: Open the file in its default application
   - **Reveal**: Show the file in Windows Explorer or macOS Finder

### 4. Re-index or Clear

- To index a different directory, simply enter a new path and click "Start Indexing"
- To clear the current index, click the **"Clear Index"** button in the status bar

---

## 🎨 Supported File Types

NLP_Finder can index and search the following file types:

### Text Files
- `.txt`, `.md`, `.rst`, `.log`

### Code Files
- **JavaScript/TypeScript**: `.js`, `.ts`, `.tsx`, `.jsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`, `.h`, `.hpp`
- **Other**: `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.swift`, `.kt`, `.scala`

### Web Files
- `.html`, `.htm`, `.css`, `.scss`, `.sass`
- `.json`, `.xml`, `.yaml`, `.yml`

### Documents
- `.pdf`

### File Size Limit
- Default: **10 MB per file** (configurable in `backend/config.py`)

---

## ⚙️ Configuration

Edit `backend/config.py` to customize:

```python
# Ollama settings
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text"
LLM_MODEL = "llama3"

# File processing
MAX_FILE_SIZE_MB = 10  # Maximum file size in MB
CHUNK_SIZE = 1000      # Characters per chunk
CHUNK_OVERLAP = 200    # Overlap between chunks

# Search settings
TOP_K_RESULTS = 20            # Number of results to return
SIMILARITY_THRESHOLD = 0.3    # Minimum similarity score (0-1)
```

---

## 🔒 Privacy & Security

- ✅ **100% Local** - All AI processing happens on your machine
- ✅ **No Cloud Services** - No data sent to external APIs
- ✅ **No Telemetry** - No usage tracking or analytics
- ✅ **Open Source** - Full transparency of code
- ✅ **Your Data Stays Yours** - Complete data privacy

---

## 🎯 Use Cases

### For Developers
- Find code snippets across projects
- Search for function implementations
- Locate configuration files
- Find TODO comments or bug references

### For Writers
- Search through notes and drafts
- Find related documents by topic
- Locate specific quotes or references

### For Researchers
- Search academic papers and notes
- Find related research by concept
- Organize large document collections

### For Teams
- Search internal documentation
- Find policy documents
- Locate meeting notes and decisions

---

## 💡 Tips for Best Results

1. **Be Specific**: More specific queries yield better results
   - ❌ "authentication"
   - ✅ "JWT token validation in user authentication"

2. **Use Context**: Include relevant context in your queries
   - ❌ "database"
   - ✅ "database connection pooling configuration"

3. **Try Variations**: If you don't find what you need, try rephrasing
   - "error handling" → "exception management" → "try catch blocks"

4. **Index Strategically**: Index project directories rather than entire drives
   - Better: `C:\Projects\MyApp`
   - Slower: `C:\Users`

5. **Keep Files Updated**: Re-index after major changes to your codebase

---

**Happy Searching! 🎉**
