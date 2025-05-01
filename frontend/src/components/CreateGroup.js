import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CreateGroup({ open, onClose, onCreateSuccess, userId, token }) {
  const [groupData, setGroupData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const API_BASE_URL = 'http://localhost:8081';
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setGroupData({ name: '', description: '' });
      setError('');
    }
  }, [open]);
  
  const handleChange = (e) => {
    setGroupData({
      ...groupData,
      [e.target.name]: e.target.value
    });
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!open) return; // Don't submit if modal is closed
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate the required fields
      if (!groupData.name.trim()) {
        setError('Group name is required');
        setIsSubmitting(false);
        return;
      }
      
      // Use the props instead of trying to access localStorage directly
      if (!userId) {
        setError('Authentication error. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      const data = {
        name: groupData.name.trim(),
        description: groupData.description.trim(),
        createdBy: userId
      };

      // Try all possible endpoint patterns
      let response;
      try {
        // Try first endpoint pattern with query parameters instead of headers
        response = await axios.post(`${API_BASE_URL}/api/groups`, data, {
          params: { userId: userId },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (firstError) {
        console.log('First endpoint failed, trying alternate endpoint');
        response = await axios.post(`${API_BASE_URL}/api/v1/groups`, data, {
          params: { userId: userId },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      onCreateSuccess(response.data);
      setGroupData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating group:', error);
      
      if (error.message === 'Network Error') {
        setError('Server is not responding. Please ensure the backend server is running.');
      } else if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          setError('Authentication error: ' + (
            typeof error.response.data === 'string' 
              ? error.response.data 
              : 'Full authentication is required to access this resource'
          ));
        } else if (error.response.status === 404) {
          setError('API endpoint not found. Please contact the administrator.');
        } else if (error.response.data && typeof error.response.data === 'string') {
          setError(error.response.data);
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`Error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else {
        setError('Failed to create group. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create Group</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                <p>{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={groupData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={groupData.description}
                onChange={handleChange}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;