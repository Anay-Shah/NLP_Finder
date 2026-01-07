import React, { useState, useEffect } from 'react';
import './IndexedFilesList.css';
import { getIndexedFiles, openFile } from '../api';

const IndexedFilesList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, size, chunks

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getIndexedFiles();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredAndSortedFiles = () => {
    let filtered = files;

    // Filter by search
    if (searchFilter) {
      filtered = filtered.filter(f =>
        f.file_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.file_path.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'chunks':
          return b.total_chunks - a.total_chunks;
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <div className="indexed-files-list">
        <div className="files-header">
          <h3>📚 Indexed Files</h3>
        </div>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="indexed-files-list">
        <div className="files-header">
          <h3>📚 Indexed Files</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>No files have been indexed yet</p>
        </div>
      </div>
    );
  }

  const displayedFiles = filteredAndSortedFiles();

  return (
    <div className="indexed-files-list">
      <div className="files-header">
        <h3>📚 Indexed Files</h3>
        <span className="files-count">{files.length} files</span>
      </div>

      <div className="files-controls">
        <input
          type="text"
          className="search-filter"
          placeholder="Filter files..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="size">Sort by Size</option>
          <option value="chunks">Sort by Chunks</option>
        </select>
      </div>

      <div className="files-list">
        {displayedFiles.map((file, index) => (
          <div key={index} className="file-item">
            <div className="file-item-main">
              <span className="file-icon">{getFileIcon(file.file_name)}</span>
              <div className="file-info">
                <div className="file-name" title={file.file_name}>
                  {file.file_name}
                </div>
                <div className="file-path" title={file.file_path}>
                  {file.file_path}
                </div>
              </div>
            </div>
            <div className="file-meta">
              <span className="file-size">{formatFileSize(file.file_size)}</span>
              <span className="file-chunks">{file.total_chunks} chunks</span>
            </div>
            <div className="file-actions">
              <button
                onClick={() => handleOpenFile(file.file_path, false)}
                className="btn-file-action"
                title="Open file"
              >
                📂
              </button>
              <button
                onClick={() => handleOpenFile(file.file_path, true)}
                className="btn-file-action"
                title="Reveal in explorer"
              >
                📍
              </button>
            </div>
          </div>
        ))}
      </div>

      {displayedFiles.length === 0 && searchFilter && (
        <div className="no-results-filter">
          <p>No files match "{searchFilter}"</p>
        </div>
      )}
    </div>
  );
};

export default IndexedFilesList;
