"""Configuration for NLP_Finder backend."""
import os

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3")

# File processing settings
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

SUPPORTED_EXTENSIONS = {
    # Text files
    '.txt', '.md', '.rst', '.log',
    # Code files
    '.py', '.js', '.ts', '.tsx', '.jsx',
    '.java', '.cpp', '.c', '.h', '.hpp',
    '.cs', '.go', '.rs', '.rb', '.php',
    '.swift', '.kt', '.scala',
    # Web files
    '.html', '.htm', '.css', '.scss', '.sass',
    '.json', '.xml', '.yaml', '.yml',
    # Documents
    '.pdf',
}

# Indexing settings
CHUNK_SIZE = 1000  # characters per chunk
CHUNK_OVERLAP = 200  # overlap between chunks
BATCH_SIZE = 32  # batch size for embedding

# Storage paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FAISS_INDEX_DIR = os.path.join(DATA_DIR, "faiss_index")
METADATA_DIR = os.path.join(DATA_DIR, "metadata")

# Create directories if they don't exist
os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
os.makedirs(METADATA_DIR, exist_ok=True)

# Search settings
TOP_K_RESULTS = 20
SIMILARITY_THRESHOLD = 0.4  # Minimum similarity score (0-1). Higher = more strict
