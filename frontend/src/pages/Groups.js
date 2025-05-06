import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch groups data - replace with actual API call when ready
    const fetchGroups = async () => {
      try {
        // Mock data for now
        setGroups([
          { id: 1, name: 'Web Development', members: 24, description: 'A group for web development enthusiasts' },
          { id: 2, name: 'Mobile App Development', members: 18, description: 'Discuss mobile app development technologies' },
          { id: 3, name: 'Data Science', members: 32, description: 'Share knowledge about data science and machine learning' }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, []);

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

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Groups</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
              <p className="text-gray-500 mb-3">{group.members} members</p>
              <p className="text-gray-700">{group.description}</p>
              <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                View Group
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Groups;
