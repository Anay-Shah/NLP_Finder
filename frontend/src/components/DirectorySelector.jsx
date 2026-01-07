import React, { useState, useEffect } from 'react';
import './DirectorySelector.css';
import { startIndexing, getIndexingProgress, getIndexStats } from '../api';

const DirectorySelector = ({ onIndexComplete }) => {
  const [directory, setDirectory] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [indexStats, setIndexStats] = useState(null);

  useEffect(() => {
    loadIndexStats();
  }, []);

  useEffect(() => {
    let interval;
    if (isIndexing) {
      interval = setInterval(async () => {
        try {
          const progressData = await getIndexingProgress();
          setProgress(progressData);
          
          if (progressData.status === 'completed') {
            setIsIndexing(false);
            setError('');
            await loadIndexStats();
            if (onIndexComplete) onIndexComplete();
          } else if (progressData.status === 'error') {
            setIsIndexing(false);
            setError(progressData.message);
          }
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIndexing, onIndexComplete]);

  const loadIndexStats = async () => {
    try {
      const stats = await getIndexStats();
      setIndexStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleStartIndexing = async () => {
    if (!directory.trim()) {
      setError('Please enter a directory path');
      return;
    }

    setError('');
    setIsIndexing(true);
    setProgress({ status: 'indexing', current: 0, total: 0, message: 'Starting...' });

    try {
      await startIndexing(directory);
    } catch (err) {
      setIsIndexing(false);
      setError(err.response?.data?.detail || 'Failed to start indexing');
    }
  };

  const getProgressPercentage = () => {
    if (!progress || !progress.total) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  return (
    <div className="directory-selector">
      <div className="selector-header">
        <h2>📁 Index Directory</h2>
        {indexStats?.indexed && (
          <div className="index-stats">
            <span className="stat-badge">
              ✓ {indexStats.total_files} files indexed
            </span>
            {indexStats.indexed_directory && (
              <span className="stat-path" title={indexStats.indexed_directory}>
                {indexStats.indexed_directory}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="input-group">
        <input
          type="text"
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          placeholder="Enter directory path (e.g., C:\Users\YourName\Documents)"
          disabled={isIndexing}
          className="directory-input"
        />
        <button
          onClick={handleStartIndexing}
          disabled={isIndexing || !directory.trim()}
          className="btn btn-primary"
        >
          {isIndexing ? 'Indexing...' : 'Start Indexing'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {isIndexing && progress && (
        <div className="progress-container">
          <div className="progress-info">
            <span className="progress-text">{progress.message}</span>
            <span className="progress-percentage">{getProgressPercentage()}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          {progress.current > 0 && (
            <div className="progress-details">
              {progress.current} / {progress.total} files
            </div>
          )}
        </div>
      )}

      <div className="help-text">
        <p>💡 <strong>Tips:</strong></p>
        <ul>
          <li>Use absolute paths for best results</li>
          <li>Supported files: .txt, .md, .pdf, .py, .js, .ts, .html, .css, .json, and more</li>
          <li>Large directories may take several minutes to index</li>
        </ul>
      </div>
    </div>
  );
};

export default DirectorySelector;
