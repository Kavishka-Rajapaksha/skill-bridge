import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token from localStorage if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage if not already in headers
    if (!config.headers.Authorization) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          const token = userData.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error accessing token:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors (401)
    if (error.response && error.response.status === 401) {
      // Clear localStorage and potentially redirect to login
      console.error('Authentication error:', error.response.data);
      // localStorage.removeItem('user');
      // window.location.href = '/login'; // Uncomment if you want automatic redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
