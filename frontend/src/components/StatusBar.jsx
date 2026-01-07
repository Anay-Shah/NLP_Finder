import React, { useState, useEffect } from 'react';
import './StatusBar.css';
import { checkHealth, getIndexStats, clearIndex } from '../api';

const StatusBar = ({ onClearIndex }) => {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const [healthData, statsData] = await Promise.all([
        checkHealth(),
        getIndexStats()
      ]);
      setHealth(healthData);
      setStats(statsData);
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const handleClearIndex = async () => {
    if (!window.confirm('Are you sure you want to clear the current index? This action cannot be undone.')) {
      return;
    }

    try {
      await clearIndex();
      await checkStatus();
      if (onClearIndex) onClearIndex();
      alert('Index cleared successfully');
    } catch (err) {
      alert('Failed to clear index: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!health) {
    return (
      <div className="status-bar">
        <div className="status-item">
          <span className="status-dot loading"></span>
          <span>Checking status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="status-bar">
      <div className="status-items">
        <div className="status-item" title={health.ollama_connected ? 'Ollama is running' : 'Ollama is not running'}>
          <span className={`status-dot ${health.ollama_connected ? 'online' : 'offline'}`}></span>
          <span>Ollama: {health.ollama_connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <div className="status-item" title={`Embedding model: ${health.embedding_model}`}>
          <span className={`status-dot ${health.embedding_model_available ? 'online' : 'offline'}`}></span>
          <span>Model: {health.embedding_model}</span>
        </div>

        {stats?.indexed && (
          <div className="status-item">
            <span className="status-dot online"></span>
            <span>{stats.total_files} files indexed</span>
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-details"
          title="Show details"
        >
          ℹ️ Details
        </button>

        {stats?.indexed && (
          <button
            onClick={handleClearIndex}
            className="btn-clear"
            title="Clear index"
          >
            🗑️ Clear Index
          </button>
        )}
      </div>

      {showDetails && (
        <div className="status-details">
          <div className="detail-section">
            <h4>Ollama Status</h4>
            <div className="detail-item">
              <span>Connection:</span>
              <span className={health.ollama_connected ? 'status-ok' : 'status-error'}>
                {health.ollama_connected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>
            <div className="detail-item">
              <span>Embedding Model:</span>
              <span>{health.embedding_model}</span>
            </div>
            <div className="detail-item">
              <span>Model Available:</span>
              <span className={health.embedding_model_available ? 'status-ok' : 'status-error'}>
                {health.embedding_model_available ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>

          {stats?.indexed && (
            <div className="detail-section">
              <h4>Index Statistics</h4>
              <div className="detail-item">
                <span>Total Files:</span>
                <span>{stats.total_files}</span>
              </div>
              <div className="detail-item">
                <span>Total Vectors:</span>
                <span>{stats.total_vectors}</span>
              </div>
              <div className="detail-item">
                <span>Directory:</span>
                <span className="detail-path" title={stats.indexed_directory}>
                  {stats.indexed_directory}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBar;
