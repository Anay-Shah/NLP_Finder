"""FastAPI backend for NLP_Finder."""
import os
import logging
import platform
import subprocess
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from indexer import FileIndexer
from utils.ollama_client import OllamaClient
import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="NLP_Finder API", version="1.0.0")

# CORS middleware for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
ollama_client = OllamaClient(
    config.OLLAMA_BASE_URL,
    config.EMBEDDING_MODEL,
    config.LLM_MODEL
)
indexer = FileIndexer(ollama_client)
indexing_progress = {
    'status': 'idle',  # idle, indexing, completed, error
    'current': 0,
    'total': 0,
    'current_file': '',
    'message': ''
}


# Request/Response models
class IndexRequest(BaseModel):
    directory: str


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = None


class FilePreviewRequest(BaseModel):
    file_path: str


class OpenFileRequest(BaseModel):
    file_path: str
    reveal: bool = False


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "NLP_Finder API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    ollama_connected = ollama_client.check_connection()
    embedding_model_available = ollama_client.check_model(config.EMBEDDING_MODEL)
    
    return {
        "status": "healthy" if ollama_connected else "unhealthy",
        "ollama_connected": ollama_connected,
        "embedding_model": config.EMBEDDING_MODEL,
        "embedding_model_available": embedding_model_available,
        "index_stats": indexer.get_stats()
    }


@app.get("/config")
async def get_config():
    """Get current configuration."""
    return {
        "ollama_url": config.OLLAMA_BASE_URL,
        "embedding_model": config.EMBEDDING_MODEL,
        "llm_model": config.LLM_MODEL,
        "max_file_size_mb": config.MAX_FILE_SIZE_MB,
        "supported_extensions": list(config.SUPPORTED_EXTENSIONS),
        "top_k_results": config.TOP_K_RESULTS
    }


@app.post("/index")
async def start_indexing(request: IndexRequest, background_tasks: BackgroundTasks):
    """Start indexing a directory."""
    global indexing_progress
    
    # Validate directory
    if not os.path.exists(request.directory):
        raise HTTPException(status_code=400, detail="Directory does not exist")
    
    if not os.path.isdir(request.directory):
        raise HTTPException(status_code=400, detail="Path is not a directory")
    
    # Check if already indexing
    if indexing_progress['status'] == 'indexing':
        raise HTTPException(status_code=400, detail="Indexing already in progress")
    
    # Check Ollama connection
    if not ollama_client.check_connection():
        raise HTTPException(status_code=503, detail="Ollama is not running or not accessible")
    
    # Reset progress
    indexing_progress = {
        'status': 'indexing',
        'current': 0,
        'total': 0,
        'current_file': '',
        'message': 'Starting indexing...'
    }
    
    # Start indexing in background
    def progress_callback(current, total, file_path):
        indexing_progress['current'] = current
        indexing_progress['total'] = total
        indexing_progress['current_file'] = file_path
        indexing_progress['message'] = f'Indexing {current}/{total}: {os.path.basename(file_path)}'
    
    def index_task():
        global indexing_progress
        try:
            result = indexer.index_directory(request.directory, progress_callback)
            
            if result['success']:
                # Save index
                indexer.save_index()
                indexing_progress['status'] = 'completed'
                indexing_progress['message'] = result['message']
            else:
                indexing_progress['status'] = 'error'
                indexing_progress['message'] = result['message']
                
        except Exception as e:
            logger.error(f"Indexing error: {e}")
            indexing_progress['status'] = 'error'
            indexing_progress['message'] = str(e)
    
    background_tasks.add_task(index_task)
    
    return {
        "message": "Indexing started",
        "directory": request.directory
    }


@app.get("/index/progress")
async def get_indexing_progress():
    """Get current indexing progress."""
    return indexing_progress


@app.get("/index/stats")
async def get_index_stats():
    """Get index statistics."""
    return indexer.get_stats()


@app.get("/index/files")
async def get_indexed_files():
    """Get list of all indexed files."""
    if not indexer.metadata:
        return {
            "total_files": 0,
            "files": []
        }
    
    # Group by file path to get unique files
    files_dict = {}
    for meta in indexer.metadata:
        file_path = meta['file_path']
        if file_path not in files_dict:
            files_dict[file_path] = {
                'file_path': file_path,
                'file_name': meta['file_name'],
                'file_size': meta['file_size'],
                'total_chunks': meta['total_chunks'],
            }
    
    files_list = list(files_dict.values())
    files_list.sort(key=lambda x: x['file_name'].lower())
    
    return {
        "total_files": len(files_list),
        "files": files_list
    }


@app.delete("/index")
async def clear_index():
    """Clear current index."""
    success = indexer.clear_index()
    if success:
        return {"message": "Index cleared successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear index")


@app.post("/search")
async def search_files(request: SearchRequest):
    """Search for files matching query."""
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Check if index exists
    stats = indexer.get_stats()
    if not stats['indexed']:
        raise HTTPException(status_code=400, detail="No index available. Please index a directory first.")
    
    # Check Ollama connection
    if not ollama_client.check_connection():
        raise HTTPException(status_code=503, detail="Ollama is not running or not accessible")
    
    try:
        results = indexer.search(request.query, request.top_k)
        return {
            "query": request.query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/file/preview")
async def get_file_preview(request: FilePreviewRequest):
    """Get file preview content."""
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        from utils.file_processor import FileProcessor
        processor = FileProcessor()
        
        content = processor.extract_text_from_file(request.file_path)
        if content is None:
            raise HTTPException(status_code=400, detail="Could not read file content")
        
        # Limit content size for preview
        max_preview_size = 50000  # characters
        truncated = len(content) > max_preview_size
        
        return {
            "file_path": request.file_path,
            "file_name": os.path.basename(request.file_path),
            "content": content[:max_preview_size],
            "truncated": truncated,
            "total_size": len(content)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to preview file: {str(e)}")


@app.post("/file/open")
async def open_file(request: OpenFileRequest):
    """Open file in system default app or reveal in file explorer."""
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        system = platform.system()
        
        if request.reveal:
            # Reveal file in file explorer
            if system == "Windows":
                subprocess.run(['explorer', '/select,', os.path.normpath(request.file_path)])
            elif system == "Darwin":  # macOS
                subprocess.run(['open', '-R', request.file_path])
            else:  # Linux
                # Open parent directory
                subprocess.run(['xdg-open', os.path.dirname(request.file_path)])
        else:
            # Open file in default application
            if system == "Windows":
                os.startfile(request.file_path)
            elif system == "Darwin":  # macOS
                subprocess.run(['open', request.file_path])
            else:  # Linux
                subprocess.run(['xdg-open', request.file_path])
        
        return {"message": "File opened successfully"}
        
    except Exception as e:
        logger.error(f"Error opening file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to open file: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
