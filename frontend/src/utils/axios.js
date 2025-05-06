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
        config.responseType = "blob";
        config.headers = {
          ...config.headers,
          Authorization: config.headers.Authorization, // Keep auth header
          Accept: "*/*",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "X-Requested-With": "XMLHttpRequest",
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
    if (response.config.responseType === "blob") {
      // Check if the blob is an error response
      if (response.data.type === "application/json") {
        return response.data.text().then((text) => {
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
    // Transform error response
    if (error.response?.data && typeof error.response.data === "object") {
      // Extract message from Spring Boot error response
      const message =
        error.response.data.message ||
        error.response.data.error ||
        "An error occurred";
      error.response.data = { error: message };
    }

    if (error.code === "ERR_NETWORK") {
      console.error("Network Error - Backend may be down:", error);
      return Promise.reject({
        response: {
          data: { error: "Network error - Please check your connection" },
        },
      });
    }

    if (error.response?.status === 403) {
      console.error("Authentication error:", error);
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      // Handle empty blob responses
      if (response.data.size === 0) {
        return Promise.reject(new Error("Empty media response"));
      }
    }
    return response;
  },
  (error) => {
    // Don't log 404s for media requests
    if (
      error.config?.responseType === "blob" &&
      error.response?.status === 404
    ) {
      return Promise.reject(error);
    }

    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error - Backend may be down:", error);
      return Promise.reject({
        response: {
          data: { error: "Network error - Please check your connection" },
        },
      });
    }

    // Handle authentication errors
    if (error.response?.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Add cleanup utility
axiosInstance.revokeObjectURL = (url) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

// Add new method for media uploads with custom timeout
axiosInstance.uploadMedia = (url, data, options = {}) => {
  return axiosInstance({
    url,
    method: "POST",
    data,
    timeout: 120000, // 2 minutes timeout for uploads
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...options,
  });
};

export default axiosInstance;
