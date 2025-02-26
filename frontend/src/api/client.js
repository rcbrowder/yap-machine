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

// Add a response interceptor for handling retries
apiClient.interceptors.response.use(
  (response) => response, // Return successful responses as-is
  async (error) => {
    const originalRequest = error.config;
    
    // If we've already retried, or there's no config, or it's a 4xx error (client error),
    // don't retry - just return the error
    if (
      originalRequest._retry ||
      !originalRequest ||
      (error.response && error.response.status >= 400 && error.response.status < 500)
    ) {
      return Promise.reject(error);
    }
    
    // We'll retry once for any network error or server error (5xx)
    originalRequest._retry = true;
    
    // Wait for 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Retrying request to ${originalRequest.url}`);
    return apiClient(originalRequest);
  }
);

export default apiClient; 