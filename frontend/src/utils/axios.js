import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8081",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // Increased default timeout to 30 seconds
});

// Update request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Add auth headers for all requests
      if (user?.email && user?.rawPassword) {
        const credentials = btoa(`${user.email}:${user.rawPassword}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }

      // Add userId to header using the Authorization approach instead of a separate header
      // This avoids CORS issues with the userId header
      if (user?.id) {
        // Include the user ID in the Authorization header or as a query parameter instead
        if (config.url.includes('?')) {
          config.url = `${config.url}&userId=${user.id}`;
        } else {
          config.url = `${config.url}?userId=${user.id}`;
        }
      }

      // Special handling for media requests
      if (config.url?.includes("/api/media/")) {
        config.responseType = 'blob';
        config.headers = {
          ...config.headers,
          Authorization: config.headers.Authorization, // Keep auth header
          Accept: '*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        };
      }

      return config;
    } catch (error) {
      console.error("Error preparing request:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.log('Access forbidden. You may need to login again.');
    } else if (error.code === 'ERR_NETWORK') {
      console.log('Network error. Backend server might be down.');
    } else if (error.message && error.message.includes('CORS')) {
      console.log('CORS error. Check backend CORS configuration.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
