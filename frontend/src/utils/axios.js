import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8081",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // Reduced default timeout from 30s to 15s
});

const isReactionRequest = (url = "") => {
  return url.includes("/api/reactions/");
};

const isCommentCountRequest = (url = "") => {
  return url.includes("/comments/count/");
};

const isMediaRequest = (url = "") => {
  return url.includes("/api/media/");
};

// Keep track of pending requests to avoid duplicates
const pendingRequests = new Map();

// Cancel token source generator
const generateCancelToken = () => {
  return axios.CancelToken.source();
};

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (user?.email && user?.rawPassword) {
        const credentials = btoa(`${user.email}:${user.rawPassword}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }

      if (config.url?.includes("/api/media/")) {
        config.responseType = "blob";
        config.headers = {
          ...config.headers,
          Authorization: config.headers.Authorization,
          Accept: "*/*",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "X-Requested-With": "XMLHttpRequest",
        };
      }

      // Special handling for reaction requests
      if (isReactionRequest(config.url)) {
        config.timeout = 10000; // 10s timeout for reactions
        config.retryAttempts = 3; // Allow 3 retries
      }
      
      // Reduce timeout for comment count requests
      if (isCommentCountRequest(config.url)) {
        config.timeout = 5000; // 5s timeout for comment counts
        config.retryAttempts = 2; // Allow 2 retries
      }

      // Check for duplicate requests and cancel previous ones
      const requestKey = `${config.method}-${config.url}`;
      if (pendingRequests.has(requestKey) && !config.allowMultiple) {
        // Cancel previous request
        const source = pendingRequests.get(requestKey);
        source.cancel('Duplicate request canceled');
      }
      
      // Create cancel token
      const source = generateCancelToken();
      config.cancelToken = source.token;
      
      if (!config.allowMultiple) {
        pendingRequests.set(requestKey, source);
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
    // Remove from pending requests map
    const requestKey = `${response.config.method}-${response.config.url}`;
    pendingRequests.delete(requestKey);
    
    if (response.config.responseType === "blob") {
      // Check if the blob is an error response
      if (response.data.type === "application/json") {
        return response.data.text().then((text) => {
          const error = JSON.parse(text);
          return Promise.reject(error);
        });
      }
      
      // Check if blob is valid
      if (response.data.size === 0) {
        return Promise.reject(new Error('Empty blob received'));
      }
      
      // Create object URL for media
      const blobUrl = URL.createObjectURL(response.data);
      response.data = blobUrl;
    }
    return response;
  },
  async (error) => {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }
    
    // Remove from pending requests map if failed
    if (error.config) {
      const requestKey = `${error.config.method}-${error.config.url}`;
      pendingRequests.delete(requestKey);
    }
    
    const requestTime = new Date().toISOString();
    const endpoint = error.config?.url || "unknown endpoint";

    // Handle reaction request errors
    if (isReactionRequest(error.config?.url)) {
      if (error.code === "ECONNABORTED" && error.config?.retryAttempts > 0) {
        error.config.retryAttempts--;
        return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
          axiosInstance(error.config)
        );
      }
    }
    
    // Handle comment count request timeouts
    if (isCommentCountRequest(error.config?.url)) {
      if (error.code === "ECONNABORTED" && error.config?.retryAttempts > 0) {
        console.log(`Retrying comment count request: ${error.config.url}`);
        error.config.retryAttempts--;
        return new Promise((resolve) => setTimeout(resolve, 500)).then(() =>
          axiosInstance(error.config)
        );
      }
      // Return empty result instead of failing
      if (error.code === "ECONNABORTED") {
        console.log(`Comment count timed out: ${error.config.url}, returning empty result`);
        return Promise.resolve({ data: { count: 0 } });
      }
    }

    if (error.code === "ERR_NETWORK") {
      console.error(
        `[${requestTime}] Network Error - Backend may be down: ${endpoint}`,
        error
      );

      // Add retry logic for media requests
      if (isMediaRequest(error.config?.url)) {
        const retryConfig = {
          ...error.config,
          retry: (error.config.retry || 0) + 1,
        };
        if (retryConfig.retry <= 3) {
          return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
            axiosInstance.request(retryConfig)
          );
        }
        
        // If exhausted retries, return a placeholder image
        return Promise.resolve({
          data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+"
        });
      }
    } else if (error.response?.status === 403) {
      console.error(
        `[${requestTime}] Authentication error at ${endpoint}:`,
        error
      );
      // Don't automatically redirect from profile pages to avoid loops
      if (!window.location.pathname.includes("/profile/")) {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.response?.status === 404) {
      console.error(
        `[${requestTime}] Resource not found at ${endpoint}:`,
        error
      );
      // Handle 404 errors differently depending on the endpoint
      if (error.config?.url?.includes("/api/users/")) {
        // Let the component handle user not found
        return Promise.reject({
          ...error,
          isUserNotFound: true,
          message: "User not found",
        });
      } else if (isMediaRequest(error.config?.url)) {
        // Return placeholder for missing media
        return Promise.resolve({
          data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4="
        });
      }
    } else if (error.code === "ECONNABORTED") {
      console.error(`[${requestTime}] Request timeout at ${endpoint}:`, error);
      
      // For comment count requests, return empty result
      if (isCommentCountRequest(error.config?.url)) {
        return Promise.resolve({ data: { count: 0 } });
      }
      
      // For media requests, return placeholder
      if (isMediaRequest(error.config?.url)) {
        return Promise.resolve({
          data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRpbWVkIE91dDwvdGV4dD48L3N2Zz4="
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

// Add method for safer comment count fetching
axiosInstance.getCommentCount = async (postId) => {
  return axiosInstance.get(`/api/comments/count/${postId}`);
};

// Add method for safer media fetching
axiosInstance.getMedia = async (mediaId) => {
  const isMediaRequestInProgress = pendingRequests.has(`media_${mediaId}`);
  if (isMediaRequestInProgress) {
    return pendingRequests.get(`media_${mediaId}`);
  }
  
  const requestPromise = axiosInstance.get(`/api/media/${mediaId}`)
    .then(response => {
      pendingRequests.delete(`media_${mediaId}`);
      return response;
    })
    .catch(error => {
      pendingRequests.delete(`media_${mediaId}`);
      throw error;
    });
    
  pendingRequests.set(`media_${mediaId}`, requestPromise);
  return requestPromise;
};

export default axiosInstance;
