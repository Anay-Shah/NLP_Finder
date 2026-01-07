"""File processing utilities for extracting text from various file types."""
import os
import logging
from typing import Optional
from pathlib import Path
import PyPDF2

logger = logging.getLogger(__name__)


class FileProcessor:
    """Process different file types and extract text content."""
    
    @staticmethod
    def is_binary(file_path: str) -> bool:
        """Check if a file is binary."""
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                # Check for null bytes which indicate binary
                return b'\x00' in chunk
        except Exception as e:
            logger.error(f"Error checking if file is binary {file_path}: {e}")
            return True
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Optional[str]:
        """Extract text from PDF file."""
        try:
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                text_parts = []
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text_parts.append(page.extract_text())
                
                return '\n'.join(text_parts)
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {e}")
            return None
    
    @staticmethod
    def extract_text_from_file(file_path: str) -> Optional[str]:
        """Extract text content from a file."""
        try:
            file_ext = Path(file_path).suffix.lower()
            
            # Handle PDF files
            if file_ext == '.pdf':
                return FileProcessor.extract_text_from_pdf(file_path)
            
            # Check if file is binary
            if FileProcessor.is_binary(file_path):
                logger.warning(f"Skipping binary file: {file_path}")
                return None
            
            # Try to read as text with UTF-8 first (most common)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                # Try alternative encodings only if UTF-8 fails
                encodings = ['latin-1', 'cp1252']
                for encoding in encodings:
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            return f.read()
                    except (UnicodeDecodeError, UnicodeError):
                        continue
            
            logger.warning(f"Could not decode file with any encoding: {file_path}")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting text from file {file_path}: {e}")
            return None
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
        """Split text into overlapping chunks."""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size * 0.5:  # Only break if we're past halfway
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap if end < len(text) else end
        
        return chunks
    
    @staticmethod
    def get_file_info(file_path: str) -> dict:
        """Get basic file information."""
        try:
            stat = os.stat(file_path)
            return {
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'created': stat.st_ctime,
            }
        except Exception as e:
            logger.error(f"Error getting file info for {file_path}: {e}")
            return {}
