import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import EditGroup from '../components/EditGroup';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const response = await axiosInstance.get(`/api/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      console.error('Error fetching group:', error);
      navigate('/groups');
    }
  };

  const handleEditSuccess = (updatedGroup) => {
    setGroup(updatedGroup);
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('Please login first');
      }

      if (group.createdBy !== user.id) {
        throw new Error('Only group owner can delete the group');
      }

      await axiosInstance.delete(`/api/groups/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': user.id
        }
      });
      navigate('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert(error.response?.data || error.message || 'Failed to delete group');
    }
  };

  if (!group) return null;

  const isOwner = user && user.id === group.createdBy;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Groups
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600">{group.description}</p>
          </div>
          {isOwner && (
            <div className="space-x-2">
              <button
                onClick={() => setShowEditDialog(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Edit Group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Delete Group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Members ({group.members.length})</h2>
          <ul className="space-y-2">
            {group.members.map((member) => (
              <li key={member} className="p-2 bg-gray-50 rounded-md">
                {member}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showEditDialog && (
        <EditGroup
          open={showEditDialog}
          group={group}
          onClose={() => setShowEditDialog(false)}
          onEditSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default GroupDetail;