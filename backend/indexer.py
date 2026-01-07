"""Indexer for managing file indexing and vector storage."""
import os
import json
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import numpy as np
import faiss

from utils.file_processor import FileProcessor
from utils.ollama_client import OllamaClient
import config

logger = logging.getLogger(__name__)


class FileIndexer:
    """Manages file indexing and vector storage using FAISS."""
    
    def __init__(self, ollama_client: OllamaClient):
        self.ollama_client = ollama_client
        self.file_processor = FileProcessor()
        self.index = None
        self.metadata = []
        self.dimension = None
        self.indexed_directory = None
        
    def _get_file_hash(self, file_path: str) -> str:
        """Generate hash of file for change detection."""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def _should_index_file(self, file_path: str) -> bool:
        """Check if file should be indexed."""
        file_ext = Path(file_path).suffix.lower()
        file_size = os.path.getsize(file_path)
        
        # Check extension
        if file_ext not in config.SUPPORTED_EXTENSIONS:
            return False
        
        # Check size
        if file_size > config.MAX_FILE_SIZE_BYTES:
            logger.warning(f"Skipping large file: {file_path} ({file_size / 1024 / 1024:.2f} MB)")
            return False
        
        # Skip empty files
        if file_size == 0:
            return False
        
        return True
    
    def scan_directory(self, directory: str) -> List[str]:
        """Scan directory and return list of files to index."""
        files_to_index = []
        
        for root, dirs, files in os.walk(directory):
            # Skip hidden directories and common ignore patterns
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in 
                      ['node_modules', '__pycache__', 'venv', 'env', '.git']]
            
            for file in files:
                if file.startswith('.'):
                    continue
                
                file_path = os.path.join(root, file)
                if self._should_index_file(file_path):
                    files_to_index.append(file_path)
        
        return files_to_index
    
    def index_directory(self, directory: str, progress_callback=None) -> Dict:
        """Index all files in a directory with batch processing."""
        logger.info(f"Starting indexing of directory: {directory}")
        
        # Scan files
        files_to_index = self.scan_directory(directory)
        total_files = len(files_to_index)
        
        if total_files == 0:
            return {
                'success': True,
                'total_files': 0,
                'indexed_files': 0,
                'failed_files': 0,
                'skipped_files': 0,
                'message': 'No files found to index'
            }
        
        logger.info(f"Found {total_files} files to index")
        
        # Reset index
        self.metadata = []
        all_embeddings = []
        indexed_count = 0
        failed_count = 0
        skipped_count = 0
        
        # Batch processing
        batch_chunks = []
        batch_metadata_temp = []
        
        for idx, file_path in enumerate(files_to_index):
            try:
                # Extract text
                text_content = self.file_processor.extract_text_from_file(file_path)
                if text_content is None:
                    logger.warning(f"Could not extract text: {file_path}")
                    skipped_count += 1
                    if progress_callback:
                        progress_callback(idx + 1, total_files, file_path)
                    continue
                    
                if not text_content.strip():
                    logger.warning(f"Empty content: {file_path}")
                    skipped_count += 1
                    if progress_callback:
                        progress_callback(idx + 1, total_files, file_path)
                    continue
                
                # Chunk text
                chunks = self.file_processor.chunk_text(
                    text_content, 
                    config.CHUNK_SIZE, 
                    config.CHUNK_OVERLAP
                )
                
                file_info = self.file_processor.get_file_info(file_path)
                
                # Add chunks to batch
                for chunk_idx, chunk in enumerate(chunks):
                    batch_chunks.append(chunk)
                    batch_metadata_temp.append({
                        'file_path': file_path,
                        'file_name': os.path.basename(file_path),
                        'chunk_index': chunk_idx,
                        'total_chunks': len(chunks),
                        'chunk_text': chunk,
                        'file_size': file_info.get('size', 0),
                        'file_hash': self._get_file_hash(file_path),
                    })
                
                # Process batch when it reaches BATCH_SIZE
                if len(batch_chunks) >= config.BATCH_SIZE:
                    embeddings = self.ollama_client.embed_batch(batch_chunks)
                    for emb, meta in zip(embeddings, batch_metadata_temp):
                        if emb is not None:
                            all_embeddings.append(emb)
                            self.metadata.append(meta)
                    batch_chunks = []
                    batch_metadata_temp = []
                
                indexed_count += 1
                
                # Progress callback
                if progress_callback:
                    progress_callback(idx + 1, total_files, file_path)
                
            except Exception as e:
                logger.error(f"Error indexing file {file_path}: {e}")
                failed_count += 1
        
        # Process remaining chunks
        if batch_chunks:
            embeddings = self.ollama_client.embed_batch(batch_chunks)
            for emb, meta in zip(embeddings, batch_metadata_temp):
                if emb is not None:
                    all_embeddings.append(emb)
                    self.metadata.append(meta)
        
        if not all_embeddings:
            return {
                'success': False,
                'total_files': total_files,
                'indexed_files': 0,
                'failed_files': failed_count,
                'skipped_files': skipped_count,
                'message': 'No files were successfully indexed'
            }
        
        # Create FAISS index
        embeddings_array = np.array(all_embeddings, dtype=np.float32)
        self.dimension = embeddings_array.shape[1]
        
        # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(embeddings_array)
        self.index.add(embeddings_array)
        
        self.indexed_directory = directory
        
        logger.info(f"Indexing complete. Indexed {indexed_count}/{total_files} files")
        
        return {
            'success': True,
            'total_files': total_files,
            'indexed_files': indexed_count,
            'failed_files': failed_count,
            'skipped_files': skipped_count,
            'total_chunks': len(self.metadata),
            'message': f'Successfully indexed {indexed_count} files ({skipped_count} skipped, {failed_count} failed)'
        }
    
    def _enrich_query(self, query: str) -> str:
        """Enrich query with technical context for better semantic matching."""
        query_lower = query.lower()
        
        # Add technical synonyms for common programming concepts
        enrichments = []
        
        if any(word in query_lower for word in ['define', 'defined', 'declaration', 'declare']):
            enrichments.append('const let var function class')
        
        if 'map' in query_lower and 'icon' in query_lower:
            enrichments.append('object dictionary key-value pairs')
        
        if any(word in query_lower for word in ['where', 'find', 'locate']):
            enrichments.append('implementation source code')
        
        if enrichments:
            return f"{query} {' '.join(enrichments)}"
        return query
    
    def _calculate_keyword_boost(self, query: str, chunk_text: str) -> float:
        """Calculate boost score based on exact keyword matches."""
        query_lower = query.lower()
        chunk_lower = chunk_text.lower()
        boost = 0.0
        
        # Boost for exact technical term matches
        technical_patterns = [
            ('const ', 5.0),
            ('function ', 5.0),
            ('class ', 5.0),
            ('= {', 3.0),  # Object literal
            ('=>', 3.0),   # Arrow function
            ('import ', 2.0),
            ('export ', 2.0),
        ]
        
        for pattern, score in technical_patterns:
            if pattern in query_lower and pattern in chunk_lower:
                boost += score
        
        return boost
    
    def _get_file_type_weight(self, file_path: str, query: str) -> float:
        """Weight results based on file type relevance to query."""
        ext = os.path.splitext(file_path)[1].lower()
        query_lower = query.lower()
        
        # For code-related queries, boost code files over style files
        code_indicators = ['function', 'const', 'let', 'var', 'class', 'method', 
                          'define', 'declaration', 'implementation', 'object']
        
        is_code_query = any(indicator in query_lower for indicator in code_indicators)
        
        if is_code_query:
            # Code files get higher weight
            code_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'}
            if ext in code_extensions:
                return 1.15  # 15% boost
            
            # Style/config files get lower weight for code queries
            style_extensions = {'.css', '.scss', '.sass', '.less'}
            if ext in style_extensions:
                return 0.85  # 15% penalty
        
        return 1.0  # No adjustment
    
    def search(self, query: str, top_k: int = None) -> List[Dict]:
        """Search for files matching the query with enhanced semantic understanding."""
        if self.index is None or len(self.metadata) == 0:
            return []
        
        if top_k is None:
            top_k = config.TOP_K_RESULTS
        
        # Enrich query for better semantic matching
        enriched_query = self._enrich_query(query)
        logger.info(f"Original query: '{query}'")
        if enriched_query != query:
            logger.info(f"Enriched query: '{enriched_query}'")
        
        # Generate query embedding
        query_embedding = self.ollama_client.embed_text(enriched_query)
        if query_embedding is None:
            logger.error("Failed to generate query embedding")
            return []
        
        # Normalize query vector
        query_vector = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_vector)
        
        # Search
        distances, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))
        
        # Compile results
        results = []
        seen_files = set()
        
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            
            metadata = self.metadata[idx]
            file_path = metadata['file_path']
            chunk_text = metadata['chunk_text']
            
            # Calculate base similarity score (0-100)
            base_similarity = float(dist) * 100
            
            # Apply file type weighting
            file_type_weight = self._get_file_type_weight(file_path, query)
            
            # Apply keyword boost
            keyword_boost = self._calculate_keyword_boost(query, chunk_text)
            
            # Calculate final similarity with adjustments
            similarity = min(base_similarity * file_type_weight + keyword_boost, 100.0)
            
            # Skip low similarity results (configurable threshold)
            if similarity < config.SIMILARITY_THRESHOLD * 100:
                logger.debug(f"Skipping low similarity result: {similarity:.1f}% for {file_path}")
                continue
            
            # Group by file - keep best chunk per file
            if file_path not in seen_files:
                seen_files.add(file_path)
                
                results.append({
                    'file_path': file_path,
                    'file_name': metadata['file_name'],
                    'similarity_score': round(similarity, 2),
                    'chunk_text': chunk_text,
                    'chunk_index': metadata['chunk_index'],
                    'total_chunks': metadata['total_chunks'],
                    'file_size': metadata['file_size'],
                })
        
        # Re-sort by adjusted similarity scores
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return results
    
    def save_index(self, index_name: str = "default") -> bool:
        """Save index and metadata to disk."""
        try:
            if self.index is None:
                logger.warning("No index to save")
                return False
            
            index_path = os.path.join(config.FAISS_INDEX_DIR, f"{index_name}.index")
            metadata_path = os.path.join(config.METADATA_DIR, f"{index_name}.json")
            
            # Save FAISS index
            faiss.write_index(self.index, index_path)
            
            # Save metadata
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'metadata': self.metadata,
                    'dimension': self.dimension,
                    'indexed_directory': self.indexed_directory,
                }, f, indent=2)
            
            logger.info(f"Index saved: {index_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving index: {e}")
            return False
    
    def load_index(self, index_name: str = "default") -> bool:
        """Load index and metadata from disk."""
        try:
            index_path = os.path.join(config.FAISS_INDEX_DIR, f"{index_name}.index")
            metadata_path = os.path.join(config.METADATA_DIR, f"{index_name}.json")
            
            if not os.path.exists(index_path) or not os.path.exists(metadata_path):
                logger.warning(f"Index not found: {index_name}")
                return False
            
            # Load FAISS index
            self.index = faiss.read_index(index_path)
            
            # Load metadata
            with open(metadata_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.metadata = data['metadata']
                self.dimension = data['dimension']
                self.indexed_directory = data.get('indexed_directory')
            
            logger.info(f"Index loaded: {index_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading index: {e}")
            return False
    
    def clear_index(self) -> bool:
        """Clear current index."""
        try:
            self.index = None
            self.metadata = []
            self.dimension = None
            self.indexed_directory = None
            logger.info("Index cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing index: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """Get index statistics."""
        if self.index is None:
            return {
                'indexed': False,
                'total_vectors': 0,
                'total_files': 0,
            }
        
        unique_files = len(set(m['file_path'] for m in self.metadata))
        
        return {
            'indexed': True,
            'total_vectors': self.index.ntotal,
            'total_files': unique_files,
            'indexed_directory': self.indexed_directory,
            'dimension': self.dimension,
        }
