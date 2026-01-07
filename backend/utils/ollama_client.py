"""Client for interacting with Ollama API."""
import requests
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class OllamaClient:
    """Client for Ollama API operations."""
    
    def __init__(self, base_url: str, embedding_model: str, llm_model: str):
        self.base_url = base_url.rstrip('/')
        self.embedding_model = embedding_model
        self.llm_model = llm_model
    
    def check_connection(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return False
    
    def check_model(self, model_name: str) -> bool:
        """Check if a model is available in Ollama."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                return any(model['name'].startswith(model_name) for model in models)
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to check model availability: {e}")
            return False
    
    def embed_text(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        """Generate embeddings for text using Ollama."""
        if not model:
            model = self.embedding_model
        
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": model,
                    "prompt": text
                },
                timeout=15  # Reduced timeout to prevent long hangs
            )
            
            if response.status_code == 200:
                return response.json().get('embedding')
            else:
                logger.error(f"Embedding failed: {response.status_code} - {response.text}")
                return None
        except requests.exceptions.Timeout:
            logger.error(f"Embedding request timed out after 15 seconds")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    def embed_batch(self, texts: List[str], model: Optional[str] = None) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts."""
        if not model:
            model = self.embedding_model
        
        embeddings = []
        for i, text in enumerate(texts):
            try:
                # Truncate very long texts to avoid timeouts
                max_length = 8000  # Reasonable limit for embedding
                truncated_text = text[:max_length] if len(text) > max_length else text
                
                embedding = self.embed_text(truncated_text, model)
                embeddings.append(embedding)
                
                # Log progress for large batches
                if (i + 1) % 10 == 0:
                    logger.info(f"Embedded {i + 1}/{len(texts)} chunks")
                    
            except Exception as e:
                logger.error(f"Error embedding text {i + 1}: {e}")
                embeddings.append(None)
        
        return embeddings
    
    def generate_completion(self, prompt: str, model: Optional[str] = None, 
                          system: Optional[str] = None) -> Optional[str]:
        """Generate text completion using Ollama LLM."""
        if not model:
            model = self.llm_model
        
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            
            if system:
                payload["system"] = system
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json().get('response')
            else:
                logger.error(f"Completion failed: {response.status_code} - {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate completion: {e}")
            return None
    
    def extract_snippet(self, query: str, text: str, max_length: int = 300) -> str:
        """Extract relevant snippet from text using LLM."""
        prompt = f"""Given this search query: "{query}"

Extract the most relevant snippet (max {max_length} characters) from the following text:

{text[:2000]}

Return ONLY the extracted snippet, nothing else."""
        
        snippet = self.generate_completion(prompt)
        if snippet and len(snippet) <= max_length * 1.5:
            return snippet.strip()
        
        # Fallback to simple extraction
        return text[:max_length] + "..." if len(text) > max_length else text
