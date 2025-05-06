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
      console.error("Auth error:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Update response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      // Check if the blob is an error response
      if (response.data.type === 'application/json') {
        return response.data.text().then(text => {
          const error = JSON.parse(text);
          return Promise.reject(error);
        });
      }
      // Create object URL for media
      const blobUrl = URL.createObjectURL(response.data);
      response.data = blobUrl;
    }
    return response;
  },
  (error) => {
    // Add timing information to error logging
    const requestTime = new Date().toISOString();
    const endpoint = error.config?.url || 'unknown endpoint';
    
    if (error.code === "ERR_NETWORK") {
      console.error(`[${requestTime}] Network Error - Backend may be down: ${endpoint}`, error);
      
      // Add retry logic for media requests
      if (error.config?.url?.includes("/api/media/")) {
        const retryConfig = {
          ...error.config,
          retry: (error.config.retry || 0) + 1,
        };
        if (retryConfig.retry <= 3) {
          return new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => axiosInstance.request(retryConfig));
        }
      }
    } else if (error.response?.status === 403) {
      console.error(`[${requestTime}] Authentication error at ${endpoint}:`, error);
      // Don't automatically redirect from profile pages to avoid loops
      if (!window.location.pathname.includes('/profile/')) {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.response?.status === 404) {
      console.error(`[${requestTime}] Resource not found at ${endpoint}:`, error);
      // Handle 404 errors differently depending on the endpoint
      if (error.config?.url?.includes('/api/users/')) {
        // Let the component handle user not found
        return Promise.reject({
          ...error,
          isUserNotFound: true,
          message: "User not found"
        });
      }
    } else {
      console.error(`[${requestTime}] API error at ${endpoint}:`, error);
    }
    
    return Promise.reject(error);
  }
);

// Add cleanup utility 
axiosInstance.revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// Add new method for media uploads with custom timeout
axiosInstance.uploadMedia = (url, data, options = {}) => {
  return axiosInstance({
    url,
    method: 'POST',
    data,
    timeout: 120000, // 2 minutes timeout for uploads
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...options,
  });
};

export default axiosInstance;
