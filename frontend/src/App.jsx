import React, { useState, useEffect } from 'react';
import './App.css';
import DirectorySelector from './components/DirectorySelector';
import SearchInterface from './components/SearchInterface';
import SearchResults from './components/SearchResults';
import StatusBar from './components/StatusBar';
import IndexedFilesList from './components/IndexedFilesList';
import { checkHealth } from './api';

function App() {
  const [isIndexed, setIsIndexed] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('search'); // 'search' or 'files'

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const health = await checkHealth();
      setOllamaStatus(health);
      if (health.index_stats?.indexed) {
        setIsIndexed(true);
      }
    } catch (err) {
      console.error('Error checking Ollama status:', err);
      setOllamaStatus({ ollama_connected: false });
    }
  };

  const handleIndexComplete = () => {
    setIsIndexed(true);
    checkOllamaStatus();
  };

  const handleSearchComplete = (results, query) => {
    setSearchResults(results);
    setCurrentQuery(query);
  };

  const handleClearIndex = () => {
    setIsIndexed(false);
    setSearchResults(null);
    setCurrentQuery('');
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>🔎 NLP_Finder</h1>
            <p className="tagline">Local Semantic File Search</p>
          </div>
          <div className="header-actions">
            <button
              className="btn-theme"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {ollamaStatus && !ollamaStatus.ollama_connected && (
            <div className="alert alert-error">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <strong>Ollama Not Running</strong>
                <p>
                  Please start Ollama before using NLP_Finder. 
                  Make sure Ollama is running on <code>localhost:11434</code> and the 
                  <code>{ollamaStatus.embedding_model || 'nomic-embed-text'}</code> model is available.
                </p>
              </div>
            </div>
          )}

          <StatusBar onClearIndex={handleClearIndex} />

          <DirectorySelector onIndexComplete={handleIndexComplete} />
          {isIndexed && (
            <>
              <div className="view-tabs">
                <button
                  className={`view-tab ${activeView === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveView('search')}
                >
                  🔍 Search
                </button>
                <button
                  className={`view-tab ${activeView === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveView('files')}
                >
                  📚 Indexed Files
                </button>
              </div>

              {activeView === 'search' && (
                <>
                  <SearchInterface onSearchComplete={handleSearchComplete} />
                  {searchResults && (
                    <SearchResults results={searchResults} query={currentQuery} />
                  )}
                </>
              )}

              {activeView === 'files' && (
                <IndexedFilesList />
              )}
            </>
          )}

          {!isIndexed && (
            <div className="welcome-message">
              <div className="welcome-icon">📂</div>
              <h2>Welcome to NLP_Finder</h2>
              <p>Get started by indexing a directory above. Once indexed, you can search through your files using natural language queries.</p>
              <div className="feature-list">
                <div className="feature">
                  <span className="feature-icon">🤖</span>
                  <div>
                    <strong>100% Local AI</strong>
                    <p>All processing happens on your machine using Ollama</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <div>
                    <strong>Private & Secure</strong>
                    <p>No data leaves your computer, no cloud services</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <div>
                    <strong>Fast Semantic Search</strong>
                    <p>Find files by meaning, not just keywords</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Powered by <strong>Ollama</strong> • Built with <strong>React</strong> & <strong>FastAPI</strong>
        </p>
        <p className="footer-hint">
          Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to focus search (when available)
        </p>
      </footer>
    </div>
  );
}

export default App;
