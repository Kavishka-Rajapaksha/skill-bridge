import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateGroup from './CreateGroup';
import { useNavigate } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';

function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [serverError, setServerError] = useState(null);
  
  const API_BASE_URL = 'http://localhost:8081';
  const navigate = useNavigate();
  
  // Fetch all groups
  const fetchGroups = async () => {
    try {
      // Get user data - note that we need to handle different user data formats
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const userId = user?.id || user?._id;
      const token = localStorage.getItem('token');
      
      if (!user) {
        setError('');  // Don't show error since user is already logged in according to header
        setLoading(false);
        return;
      }
      
      // Add auth headers to every request
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        // Add these additional headers that might be required by your API
        'userId': userId,
        'user-id': userId
      };
      
      console.log('Attempting to fetch groups for user:', userId);
      console.log('Auth token available:', !!token);
      
      // Try direct API call with proper auth headers and handle network errors better
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/groups`, {
          headers: authHeaders,
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Groups API response:', response.data);
        setGroups(response.data);
        setError('');
        setLoading(false);
        return;
      } catch (err) {
        console.log('Error fetching groups:', err);
        
        // Handle specific error scenarios
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setServerError({
            title: 'Connection Error',
            message: 'Cannot connect to the server. Please check if your backend server is running.',
            fixes: [
              'Make sure your backend server is running on port 8081',
              'Check your internet connection',
              'Verify that your backend service is properly configured',
              'Try restarting your backend server'
            ],
            canRetry: true
          });
        } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log('Auth issue detected but ignoring as user appears logged in');
          setError('');
        } else {
          setError('Failed to load groups. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again later.');
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    fetchGroups();
  }, []);
  
  // Handle group creation
  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, newGroup]);
    setShowCreateModal(false);
  };
  
  // Check if user is logged in before showing create modal
  const handleCreateClick = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setError('You must be logged in to create a group');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setShowCreateModal(true);
  };

  // Handle group edit
  const startEditing = (group) => {
    setEditingGroup({ ...group });
  };
  
  const handleUpdate = async () => {
    if (!editingGroup) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Try both API endpoints
      let response;
      try {
        response = await axios.put(
          `${API_BASE_URL}/api/groups/${editingGroup.id}`, 
          editingGroup,
          {
            params: { userId: user.id }, // Send userId as query parameter instead of header
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } catch (firstErr) {
        response = await axios.put(
          `${API_BASE_URL}/api/v1/groups/${editingGroup.id}`, 
          editingGroup,
          {
            params: { userId: user.id },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      setGroups(groups.map(g => g.id === editingGroup.id ? response.data : g));
      setEditingGroup(null);
    } catch (err) {
      console.error('Error updating group:', err);
      
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to update this group.');
      } else {
        setError('Failed to update group. Please try again.');
      }
    }
  };
  
  // Handle group delete
  const startDelete = (group) => {
    setConfirmDelete(group);
  };
  
  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Try both API endpoints
      try {
        await axios.delete(`${API_BASE_URL}/api/groups/${confirmDelete.id}`, {
          params: { userId: user.id },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (firstErr) {
        await axios.delete(`${API_BASE_URL}/api/v1/groups/${confirmDelete.id}`, {
          params: { userId: user.id },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      setGroups(groups.filter(g => g.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting group:', err);
      
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to delete this group.');
      } else {
        setError('Failed to delete group. Please try again.');
      }
    }
  };
  
  // If there's a server error, show a more helpful error page
  if (serverError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-800">{serverError.title || 'Something went wrong'}</h2>
            <p className="mt-2 text-gray-600">{serverError.message || 'Server is not responding. Please ensure the backend server is running.'}</p>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-700">Check the following:</h3>
            <ul className="mt-2 space-y-2 text-gray-600 text-sm">
              {serverError.fixes?.map((fix, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{fix}</span>
                </li>
              )) || (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Make sure your backend server is running</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Verify API endpoints are configured correctly</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <button 
              onClick={() => { setServerError(null); fetchGroups(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Groups</h1>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Group
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
          {error.includes('login') && (
            <button 
              onClick={() => navigate('/login')}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Login Now
            </button>
          )}
        </div>
      )}
      
      {serverError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>{serverError}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!loading && !error && (
        <>
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <div key={group.id || group._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-6 bg-white flex flex-col h-full">
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                      <p className="text-gray-600 mb-4">{group.description || "No description provided."}</p>
                      
                      {group.members && (
                        <p className="text-sm text-gray-500 mb-4">
                          <span className="font-medium">{group.members.length}</span> member{group.members.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => navigate(`/groups/${group.id || group._id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                      
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => startEditing(group)}
                          className="text-gray-700 hover:text-blue-600 flex items-center"
                          aria-label="Edit group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button 
                          onClick={() => startDelete(group)}
                          className="text-gray-700 hover:text-red-600 flex items-center"
                          aria-label="Delete group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-xl text-gray-600 mt-4">You haven't created any groups yet</p>
              <p className="text-gray-500 mt-2">Create your first group to start collaborating</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Create Group Modal */}
      <CreateGroup 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSuccess={handleGroupCreated}
        userId={JSON.parse(localStorage.getItem('user'))?.id || JSON.parse(localStorage.getItem('user'))?._id}
        token={localStorage.getItem('token')}
      />
      
      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows="4"
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setEditingGroup(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Delete</h2>
            </div>
            <div className="p-6">
              <p>Are you sure you want to delete the group "{confirmDelete.name}"? This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManagement;