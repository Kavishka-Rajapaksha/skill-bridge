import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

function EditGroup({ open, group, onClose, onEditSuccess }) {
  const [groupData, setGroupData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setGroupData({
        name: group.name,
        description: group.description
      });
    }
  }, [group]);

  const handleChange = (e) => {
    setGroupData({
      ...groupData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('Please login first');
      }

      if (group.createdBy !== user.id) {
        throw new Error('Only group owner can edit the group');
      }

      const response = await axiosInstance.put(
        `/api/groups/${group.id}`,
        {
          ...groupData,
          createdBy: user.id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'userId': user.id
          }
        }
      );

      onEditSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating group:', error);
      setError(error.response?.data || error.message || 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
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
                required
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
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditGroup;