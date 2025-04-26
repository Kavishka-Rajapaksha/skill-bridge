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

      if (user?.id && user?.password) {
        const credentials = btoa(`${user.email}:${user.password}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }

      // Special handling for media requests
      if (config.url?.includes("/api/media/")) {
        config.responseType = "blob";
        config.headers = {
          ...config.headers,
          Accept: "*/*",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
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

      // Make sure we only create object URLs for actual media content
      if (
        response.data.size > 0 &&
        response.headers["content-type"] &&
        (response.headers["content-type"].startsWith("image/") ||
          response.headers["content-type"].startsWith("video/"))
      ) {
        // Create object URL for media
        const blobUrl = URL.createObjectURL(response.data);
        response.data = {
          url: blobUrl,
          type: response.headers["content-type"],
          size: response.data.size,
        };
      }
    }
    return response;
  },
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error - Backend may be down:", error);
      // Add retry logic for media requests
      if (error.config?.url?.includes("/api/media/")) {
        const retryConfig = {
          ...error.config,
          retry: (error.config.retry || 0) + 1,
        };
        if (retryConfig.retry <= 3) {
          return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
            axiosInstance.request(retryConfig)
          );
        }
      }
    } else if (error.response?.status === 403) {
      console.error("Authentication error:", error);
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (error.response?.status === 401) {
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
