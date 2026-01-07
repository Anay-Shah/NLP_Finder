import React, { useState } from 'react';
import './SearchResults.css';
import { openFile, getFilePreview } from '../api';
import FilePreview from './FilePreview';

const SearchResults = ({ results, query }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  if (!results) {
    return null;
  }

  if (results.total_results === 0 && query) {
    return (
      <div className="search-results">
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try different keywords or check if the directory is indexed</p>
        </div>
      </div>
    );
  }

  if (results.total_results === 0) {
    return null;
  }

  const handleFileClick = async (result) => {
    setSelectedFile(result);
    setLoadingPreview(true);
    try {
      const preview = await getFilePreview(result.file_path);
      setPreviewData(preview);
    } catch (err) {
      console.error('Error loading preview:', err);
      setPreviewData({ error: 'Failed to load file preview' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenFile = async (filePath, reveal = false) => {
    try {
      await openFile(filePath, reveal);
    } catch (err) {
      console.error('Error opening file:', err);
      alert('Failed to open file: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleClosePreview = () => {
    setSelectedFile(null);
    setPreviewData(null);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'py': '🐍',
      'js': '🟨',
      'ts': '🔷',
      'tsx': '⚛️',
      'jsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'pdf': '📕',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'go': '🔵',
      'rs': '🦀',
      'rb': '💎',
    };
    return iconMap[ext] || '📄';
  };

  const getSimilarityColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-blue)';
    if (score >= 40) return 'var(--accent-yellow)';
    return 'var(--text-secondary)';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const words = query.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  };

  return (
    <div className="search-results">
      <div className="results-header">
        <h3>
          Search Results
          <span className="results-count">{results.total_results} files found</span>
        </h3>
        {query && (
          <div className="search-query">
            Searching for: <strong>"{query}"</strong>
          </div>
        )}
      </div>

      <div className="results-container">
        <div className="results-list">
          {results.results.map((result, index) => (
            <div
              key={index}
              className={`result-item ${selectedFile?.file_path === result.file_path ? 'selected' : ''}`}
              onClick={() => handleFileClick(result)}
            >
              <div className="result-header">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(result.file_name)}</span>
                  <div className="file-details">
                    <div className="file-name" title={result.file_name}>
                      {result.file_name}
                    </div>
                    <div className="file-path" title={result.file_path}>
                      {result.file_path}
                    </div>
                  </div>
                </div>
                <div className="similarity-score" style={{ color: getSimilarityColor(result.similarity_score) }}>
                  {result.similarity_score}%
                </div>
              </div>

              <div className="result-snippet">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(result.chunk_text.substring(0, 200) + '...', query) 
                  }}
                />
              </div>

              <div className="result-footer">
                <span className="file-size">{formatFileSize(result.file_size)}</span>
                {result.total_chunks > 1 && (
                  <span className="chunk-info">
                    Chunk {result.chunk_index + 1} of {result.total_chunks}
                  </span>
                )}
                <div className="result-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFile(result.file_path, false);
                    }}
                    className="btn-action"
                    title="Open file"
                  >
                    📂 Open
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFile(result.file_path, true);
                    }}
                    className="btn-action"
                    title="Reveal in file explorer"
                  >
                    📍 Reveal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedFile && (
          <FilePreview
            file={selectedFile}
            previewData={previewData}
            loading={loadingPreview}
            query={query}
            onClose={handleClosePreview}
          />
        )}
      </div>
    </div>
  );
};

export default SearchResults;
