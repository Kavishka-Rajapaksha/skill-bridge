import axiosInstance from './axios';

class UserSearchService {
  /**
   * Search for users based on query text
   * @param {string} query - The search query
   * @returns {Promise<Array>} - Array of user objects
   */
  static async searchUsers(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      console.log("Searching users with query:", query);
      // First try the dedicated search endpoint
      const response = await axiosInstance.get(`/api/users/search?query=${encodeURIComponent(query)}`);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log("Search results:", response.data);
        return response.data;
      }
      
      // If no results or not an array, try alternative endpoint
      console.log("Trying alternative search endpoint");
      const fallbackResponse = await axiosInstance.get(`/api/users?search=${encodeURIComponent(query)}`);
      
      if (Array.isArray(fallbackResponse.data) && fallbackResponse.data.length > 0) {
        return fallbackResponse.data;
      }
      
      // If still no results, try getting all users and filtering
      console.log("No results from search endpoints. Trying to get all users and filter.");
      const allUsersResponse = await axiosInstance.get('/api/users');
      
      if (Array.isArray(allUsersResponse.data)) {
        const filteredUsers = allUsersResponse.data.filter(
          user => 
            (user.firstName && user.firstName.toLowerCase().includes(query.toLowerCase())) || 
            (user.lastName && user.lastName.toLowerCase().includes(query.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
        );
        
        console.log(`Filtered ${filteredUsers.length} users from all users list`);
        return filteredUsers;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      
      // Final fallback approach
      try {
        console.log("Attempting to get all users as fallback");
        const allUsersResponse = await axiosInstance.get('/api/admin/users');
        
        // Manually filter results if we get all users
        if (Array.isArray(allUsersResponse.data)) {
          const filteredUsers = allUsersResponse.data.filter(
            user => 
              (user.firstName && user.firstName.toLowerCase().includes(query.toLowerCase())) || 
              (user.lastName && user.lastName.toLowerCase().includes(query.toLowerCase())) ||
              (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
          );
          
          console.log("Admin fallback filtered results:", filteredUsers);
          return filteredUsers;
        }
      } catch (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
      }
      
      return [];
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User object
   */
  static async getUserById(userId) {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
  
  /**
   * Get multiple users by their IDs
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Array>} - Array of user objects
   */
  static async getUsersByIds(userIds) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }
    
    try {
      const response = await axiosInstance.post('/api/users/batch', { userIds });
      return response.data || [];
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      
      // Fallback: fetch users one by one
      try {
        const users = await Promise.all(
          userIds.map(id => this.getUserById(id).catch(() => null))
        );
        return users.filter(user => user !== null);
      } catch {
        return [];
      }
    }
  }
}

export default UserSearchService;
