import axios from 'axios';

// Create axios instance with base URL
// In development, this will use Vite's proxy to avoid CORS issues
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient; 