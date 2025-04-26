import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import CreateGroup from '../components/CreateGroup';
import EditGroup from '../components/EditGroup';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleCreateSuccess = (newGroup) => {
    setGroups([...groups, newGroup]);
    setShowCreateDialog(false);
  };

  const handleEditSuccess = (updatedGroup) => {
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    setShowEditDialog(false);
    setSelectedGroup(null);
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setShowEditDialog(true);
    setShowMenu(null);
  };

  const handleDelete = async (group) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('Please login first');
      }

      await axiosInstance.delete(`/api/groups/${group.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': user.id
        }
      });
      
      setGroups(groups.filter(g => g.id !== group.id));
      setShowMenu(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert(error.response?.data || 'Failed to delete group');
    }
  };

  const navigateToGroupDetail = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div 
                  className="flex-grow cursor-pointer" 
                  onClick={() => navigateToGroupDetail(group.id)}
                >
                  <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                  <p className="text-gray-600 mt-1">{group.description}</p>
                  <p className="text-sm text-gray-500 mt-2">Members: {group.members.length}</p>
                </div>
                {user && user.id === group.createdBy && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenu(showMenu === group.id ? null : group.id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {showMenu === group.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <button
                          onClick={() => handleEdit(group)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateDialog && (
        <CreateGroup
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreateSuccess={handleCreateSuccess}
        />
      )}

      {selectedGroup && (
        <EditGroup
          open={showEditDialog}
          group={selectedGroup}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedGroup(null);
          }}
          onEditSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default Groups;