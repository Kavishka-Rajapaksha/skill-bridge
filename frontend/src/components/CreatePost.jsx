import React, { useState } from 'react';
import { createPost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CreatePost = ({ groupId, onPostCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: []
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

  const handleImageUpload = (e) => {
    // In a real app, you would handle file uploads here
    // For now, we'll just store the file names
    const fileNames = Array.from(e.target.files).map(file => file.name);
    setFormData({
      ...formData,
      images: fileNames
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!user || !user._id) {
        throw new Error('You must be logged in to create a post');
      }
      
      const postData = {
        ...formData,
        author: user._id,
        group: groupId
      };
      
      const result = await createPost(postData);
      setSuccess('Post created successfully!');
      setFormData({ title: '', content: '', images: [] });
      
      if (onPostCreated) {
        onPostCreated(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-form">
      <h2>Create New Post</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Post title (optional)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="What's on your mind?"
            rows="4"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="images">Upload Images</label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
