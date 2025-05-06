import axios from 'axios';

// Create axios instance with proper baseURL
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  timeout: 5000,
});

// Add interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      console.error('Backend connection error:', error);
      // You can dispatch an action or use a global state management to show error
    }
    return Promise.reject(error);
  }
);

export default api;
