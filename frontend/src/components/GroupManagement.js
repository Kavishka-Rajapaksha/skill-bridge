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
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError('Please login first');
        setLoading(false);
        return;
      }
      
      // Try both API endpoints (with and without v1)
      let response;
      try {
        // First try the /api/groups endpoint
        response = await axios.get(`${API_BASE_URL}/api/groups`, {
          params: { userId: user.id }, // Send userId as query parameter instead of header
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (firstErr) {
        console.log('First endpoint failed, trying alternate endpoint');
        // If first endpoint fails, try the /api/v1/groups endpoint
        response = await axios.get(`${API_BASE_URL}/api/v1/groups`, {
          params: { userId: user.id }, // Send userId as query parameter instead of header
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      setGroups(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching groups:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          // Handle authentication error
          const responseData = err.response.data;
          // Check if the response data is a string and contains 'authentication'
          const isAuthError = typeof responseData === 'string' && responseData.includes('authentication');
          // Or check if it's an object with a message that mentions authentication
          const hasAuthMessage = responseData && 
                                typeof responseData === 'object' && 
                                responseData.message && 
                                typeof responseData.message === 'string' && 
                                responseData.message.includes('authentication');
          
          if (isAuthError || hasAuthMessage) {
            localStorage.removeItem('token'); // Clear invalid token
            setError('Authentication error. Please login again.');
            setTimeout(() => navigate('/login'), 2000); // Redirect to login
          } else {
            setError('You do not have permission to access groups.');
          }
        } else if (err.response.status === 401) {
          setError('Please login to view your groups');
          setTimeout(() => navigate('/login'), 2000); // Redirect to login
        } else {
          setError('Failed to load groups. Server returned an error.');
        }
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Server is not responding. Please ensure the backend server is running.');
      } else {
        setError('Failed to load groups. Please try again later.');
      }
    } finally {
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
  
  // If there's a server error, show the error page
  if (serverError) {
    return <ErrorPage error={serverError} resetError={() => { setServerError(null); fetchGroups(); }} />;
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Groups</h1>
        <button 
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Group
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No groups found. Create your first group!</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <div key={group.id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 bg-white">
                <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => startEditing(group)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => startDelete(group)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Group Modal */}
      <CreateGroup 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSuccess={handleGroupCreated}
        userId={JSON.parse(localStorage.getItem('user'))?.id}
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