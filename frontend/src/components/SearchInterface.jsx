import React, { useState, useRef, useEffect } from 'react';
import './SearchInterface.css';
import { searchFiles } from '../api';

const SearchInterface = ({ onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError('');
    setIsSearching(true);

    try {
      const results = await searchFiles(searchQuery);
      
      // Add to search history
      const newHistory = [
        searchQuery,
        ...searchHistory.filter(q => q !== searchQuery)
      ].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      if (onSearchComplete) {
        onSearchComplete(results, searchQuery);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
      if (onSearchComplete) {
        onSearchComplete({ results: [], total_results: 0 }, searchQuery);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <div className="search-interface">
      <div className="search-header">
        <h2>🔍 Search Files</h2>
        <p className="search-subtitle">Use natural language to find relevant files</p>
      </div>

      <div className="search-box">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 'functions that handle user authentication' or 'documents about project requirements'"
          disabled={isSearching}
          className="search-input"
          autoFocus
        />
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          className="btn btn-search"
        >
          {isSearching ? (
            <>
              <span className="spinner"></span>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {searchHistory.length > 0 && (
        <div className="search-history">
          <div className="history-header">
            <span className="history-title">Recent Searches</span>
            <button onClick={clearHistory} className="btn-clear-history">
              Clear
            </button>
          </div>
          <div className="history-items">
            {searchHistory.map((historyQuery, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(historyQuery)}
                className="history-item"
                title={historyQuery}
              >
                <span className="history-icon">🕐</span>
                {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="search-tips">
        <p><strong>Search Tips:</strong></p>
        <div className="tips-grid">
          <div className="tip">
            <span className="tip-icon">💬</span>
            <span>Use natural language queries</span>
          </div>
          <div className="tip">
            <span className="tip-icon">🎯</span>
            <span>Be specific about what you're looking for</span>
          </div>
          <div className="tip">
            <span className="tip-icon">⚡</span>
            <span>Press Enter to search quickly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;
