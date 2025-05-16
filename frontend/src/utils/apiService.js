import axiosInstance from "./axios";

/**
 * Admin Dashboard API Service
 * Centralizes all admin dashboard API calls with proper error handling and response formatting
 */
class AdminApiService {
  /**
   * Fetch recent users data
   * @param {number} limit - Number of users to fetch (default: 5)
   * @returns {Promise<Array>} - Array of recent users
   */
  static async fetchRecentUsers(limit = 5) {
    try {
      // Try the specific recent users endpoint first
      const response = await axiosInstance.get(
        `/api/admin/users/recent?limit=${limit}`
      );

      // If the response has data in expected format
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      if (
        response.data &&
        response.data.users &&
        Array.isArray(response.data.users)
      ) {
        return response.data.users;
      }

      // Fallback: get all users and sort by createdAt
      const allUsers = await axiosInstance.get("/api/admin/users");

      if (Array.isArray(allUsers.data)) {
        return allUsers.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }

      if (
        allUsers.data &&
        allUsers.data.users &&
        Array.isArray(allUsers.data.users)
      ) {
        return allUsers.data.users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }

      // If no users found yet, try a different endpoint for greater compatibility
      const alternateUsers = await axiosInstance.get("/api/users");
      if (Array.isArray(alternateUsers.data)) {
        return alternateUsers.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error("Error fetching recent users:", error);
      return [];
    }
  }

  /**
   * Fetch recent posts data
   * @param {number} limit - Number of posts to fetch (default: 5)
   * @returns {Promise<Array>} - Array of recent posts
   */
  static async fetchRecentPosts(limit = 5) {
    try {
      // Try the specific recent posts endpoint first
      const response = await axiosInstance.get(
        `/api/admin/posts/recent?limit=${limit}`
      );

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      if (
        response.data &&
        response.data.posts &&
        Array.isArray(response.data.posts)
      ) {
        return response.data.posts;
      }

      // Fallback: get all posts and sort by createdAt
      const allPosts = await axiosInstance.get("/api/admin/posts");

      if (Array.isArray(allPosts.data)) {
        return allPosts.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }

      if (
        allPosts.data &&
        allPosts.data.posts &&
        Array.isArray(allPosts.data.posts)
      ) {
        return allPosts.data.posts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error("Error fetching recent posts:", error);
      return [];
    }
  }

  /**
   * Fetch all dashboard stats in a single call
   * @returns {Promise<Object>} - Dashboard statistics
   */
  static async fetchDashboardStats() {
    try {
      const [userStats, postStats, recentUsers, recentPosts] =
        await Promise.allSettled([
          axiosInstance.get("/api/admin/stats/users"),
          axiosInstance.get("/api/admin/stats/posts"),
          this.fetchRecentUsers(),
          this.fetchRecentPosts(),
        ]);

      return {
        userStats: userStats.status === "fulfilled" ? userStats.value.data : {},
        postStats: postStats.status === "fulfilled" ? postStats.value.data : {},
        recentUsers:
          recentUsers.status === "fulfilled" ? recentUsers.value : [],
        recentPosts:
          recentPosts.status === "fulfilled" ? recentPosts.value : [],
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        userStats: {},
        postStats: {},
        recentUsers: [],
        recentPosts: [],
      };
    }
  }

  static async sharePost(postId, groupId) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axiosInstance.post(`/api/posts/${postId}/share`, {
        groupId: groupId,
        userId: user.id,
        includeOriginal: true  // Add this flag to ensure original post details are included
      });
      return response.data;
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error;
    }
  }

  /**
   * Delete notification with request cancellation support
   * @param {string} notificationId The ID of the notification to delete
   * @returns {Promise<void>}
   */
  static async deleteNotification(notificationId) {
    // Create cancel token source
    const source = axiosInstance.CancelToken.source();
    
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`, {
        cancelToken: source.token
      });
    } catch (error) {
      // Don't throw error if request was cancelled
      if (!axiosInstance.isCancel(error)) {
        console.error("Error deleting notification:", error);
        throw error;
      }
    }
  }
}

export default AdminApiService;
