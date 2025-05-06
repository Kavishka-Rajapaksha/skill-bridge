import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch group details - replace with actual API call
    const fetchGroupDetails = async () => {
      try {
        // Mock data
        setGroup({
          id: groupId,
          name: 'Group ' + groupId,
          members: 24,
          description: 'This is a detailed description for the group.',
          posts: [
            { id: 1, author: 'Jane Smith', content: 'First post in this group', createdAt: '2023-04-15' },
            { id: 2, author: 'John Doe', content: 'Another post in this group', createdAt: '2023-04-14' }
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching group details:', error);
        setLoading(false);
      }
    };
    
    fetchGroupDetails();
  }, [groupId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-red-500">Group not found</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
          <p className="text-gray-500 mb-3">{group.members} members</p>
          <p className="text-gray-700">{group.description}</p>
          <div className="mt-4 flex space-x-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
              Join Group
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
              Share
            </button>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {group.posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold">{post.author}</h3>
                <span className="text-gray-500 text-sm">{post.createdAt}</span>
              </div>
              <p className="text-gray-700">{post.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default GroupDetail;
