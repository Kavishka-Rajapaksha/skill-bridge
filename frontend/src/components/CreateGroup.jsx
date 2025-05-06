import React, { useState } from 'react';
import { createGroup } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CreateGroup = ({ onGroupCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!user || !user._id) {
        throw new Error('You must be logged in to create a group');
      }
      
      const newGroupData = {
        ...formData,
        admin: user._id,
        members: [user._id]
      };
      
      const result = await createGroup(newGroupData);
      setSuccess('Group created successfully!');
      setFormData({ name: '', description: '' });
      
      if (onGroupCreated) {
        onGroupCreated(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to create group. Please try again.');
      console.error('Error creating group:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-form">
      <h2>Create New Group</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Group Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter group name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your group"
            rows="4"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;
