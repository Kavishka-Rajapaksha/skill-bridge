import axios from 'axios';

// Create axios instance with custom config
const apiClient = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 60000, // Increase timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
apiClient.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.warn('Request timed out. You might want to retry or check server status.');
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error or server is not responding');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
