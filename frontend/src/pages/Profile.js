import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Header from "../components/Header";
import Post from "../components/Post";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (loading) {
            setError("Request timed out. Please try refreshing.");
            setLoading(false);
          }
        }, 15000);
        
        // If it's current user's profile, use data from localStorage initially
        if (isOwnProfile && currentUser) {
          setUser(currentUser);
        }
        
        // Fetch user profile
        const userResponse = await axiosInstance.get(`/api/users/${userId}`);
        setUser(userResponse.data);
        
        // Fetch user posts
        const postsResponse = await axiosInstance.get(`/api/users/${userId}/posts`);
        setPosts(postsResponse.data);
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle 404/not found error specifically
        if (error.response?.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load profile data. Please try again.");
        }
        
        // If we have currentUser data and it's their profile, show that even if API fails
        if (isOwnProfile && currentUser && !user) {
          setUser(currentUser);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isOwnProfile, currentUser]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
  };

  // Show loading state for a reasonable time only
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

  // Show error state
  if (error && !user) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </>
    );
  }

  // Show not found state as a fallback
  if (!user) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
            User not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mb-4 md:mb-0 md:mr-6">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=" + user.firstName?.charAt(0);
                  }}
                />
              ) : (
                <span className="text-4xl font-semibold text-gray-600">
                  {user.firstName?.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              
              {user.bio && (
                <div className="mt-3 text-gray-700">
                  <p>{user.bio}</p>
                </div>
              )}
              
              {isOwnProfile && (
                <button
                  onClick={() => navigate(`/edit-profile`)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* User's Posts */}
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))
        )}
      </div>
    </>
  );
}

export default Profile;
