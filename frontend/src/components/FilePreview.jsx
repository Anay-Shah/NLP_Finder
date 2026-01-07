import React, { useEffect, useState } from 'react';
import './FilePreview.css';

const FilePreview = ({ file, previewData, loading, query, onClose }) => {
  const [activeTab, setActiveTab] = useState('content');

  if (!file) return null;

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let result = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
  };

  const getLanguageFromExtension = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
    };
    return langMap[ext] || 'text';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="preview-loading">
          <div className="spinner-large"></div>
          <p>Loading preview...</p>
        </div>
      );
    }

    if (previewData?.error) {
      return (
        <div className="preview-error">
          <div className="error-icon">⚠️</div>
          <p>{previewData.error}</p>
        </div>
      );
    }

    if (!previewData?.content) {
      return (
        <div className="preview-empty">
          <p>No content available</p>
        </div>
      );
    }

    const content = previewData.content;
    const language = getLanguageFromExtension(file.file_name);
    
    return (
      <div className="preview-content-wrapper">
        {previewData.truncated && (
          <div className="truncation-notice">
            ℹ️ Preview truncated. Full file: {(previewData.total_size / 1024).toFixed(1)} KB
          </div>
        )}
        <pre className={`language-${language}`}>
          <code dangerouslySetInnerHTML={{ __html: highlightText(content, query) }} />
        </pre>
      </div>
    );
  };

  const renderMatchedChunk = () => {
    if (!file.chunk_text) return null;

    return (
      <div className="matched-chunk">
        <div className="chunk-header">
          <h4>Matched Section</h4>
          {file.total_chunks > 1 && (
            <span className="chunk-badge">
              Chunk {file.chunk_index + 1} / {file.total_chunks}
            </span>
          )}
        </div>
        <div className="chunk-content">
          <pre>
            <code dangerouslySetInnerHTML={{ __html: highlightText(file.chunk_text, query) }} />
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="file-preview">
      <div className="preview-header">
        <div className="preview-title">
          <h3>{file.file_name}</h3>
          <p className="preview-path" title={file.file_path}>
            {file.file_path}
          </p>
        </div>
        <button onClick={onClose} className="btn-close" title="Close preview">
          ✕
        </button>
      </div>

      <div className="preview-tabs">
        <button
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📄 Full Content
        </button>
        <button
          className={`tab ${activeTab === 'matched' ? 'active' : ''}`}
          onClick={() => setActiveTab('matched')}
        >
          🎯 Matched Section
        </button>
      </div>

      <div className="preview-body">
        {activeTab === 'content' && renderContent()}
        {activeTab === 'matched' && renderMatchedChunk()}
      </div>
    </div>
  );
};

export default FilePreview;
