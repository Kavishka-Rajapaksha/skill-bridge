import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Replace with your actual API URL

const getToken = () => {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('token');
};

// User API calls
export const getUser = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${id}`, userData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Group API calls
export const createGroup = async (groupData) => {
  try {
    const response = await axios.post(`${API_URL}/groups`, groupData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getAllGroups = async () => {
  try {
    const response = await axios.get(`${API_URL}/groups`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getGroupById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/groups/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Post API calls
export const createPost = async (postData) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, postData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getAllPosts = async () => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getPostsByGroup = async (groupId) => {
  try {
    const response = await axios.get(`${API_URL}/posts/group/${groupId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    console.error('API Error Response:', error.response.data);
    // You could dispatch to a notification system here
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error Request:', error.request);
    // You could check server connectivity and notify the user
  } else {
    // Something happened in setting up the request
    console.error('API Error Setup:', error.message);
  }
};