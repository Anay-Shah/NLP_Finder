import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Get configuration
export const getConfig = async () => {
  const response = await api.get('/config');
  return response.data;
};

// Start indexing
export const startIndexing = async (directory) => {
  const response = await api.post('/index', { directory });
  return response.data;
};

// Get indexing progress
export const getIndexingProgress = async () => {
  const response = await api.get('/index/progress');
  return response.data;
};

// Get index stats
export const getIndexStats = async () => {
  const response = await api.get('/index/stats');
  return response.data;
};

// Get indexed files
export const getIndexedFiles = async () => {
  const response = await api.get('/index/files');
  return response.data;
};

// Clear index
export const clearIndex = async () => {
  const response = await api.delete('/index');
  return response.data;
};

// Search files
export const searchFiles = async (query, topK = null) => {
  const response = await api.post('/search', { query, top_k: topK });
  return response.data;
};

// Get file preview
export const getFilePreview = async (filePath) => {
  const response = await api.post('/file/preview', { file_path: filePath });
  return response.data;
};

// Open file
export const openFile = async (filePath, reveal = false) => {
  const response = await api.post('/file/open', { file_path: filePath, reveal });
  return response.data;
};

export default api;
