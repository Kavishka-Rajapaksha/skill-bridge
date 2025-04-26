import React, { useState } from 'react';
import axiosInstance from '../utils/axios';

function CreateGroup({ open, onClose, onCreateSuccess }) {
  const [groupData, setGroupData] = useState({
    name: '',
    description: ''
  });

  const handleChange = (e) => {
    setGroupData({
      ...groupData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        alert('Please login first');
        return;
      }
      
      const data = {
        name: groupData.name,
        description: groupData.description,
        createdBy: user.id,
        members: [user.id]
      };

      const response = await axiosInstance.post('/api/groups', data);
      onCreateSuccess(response.data);
      setGroupData({ name: '', description: '' });
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;