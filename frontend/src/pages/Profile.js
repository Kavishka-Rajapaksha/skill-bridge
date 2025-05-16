import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import Header from "../components/Header";
import Post from "../components/Post";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");

  // Use auth context instead of localStorage
  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    // Redirect to current user's profile if no userId is provided
    if (!userId && authUser) {
      navigate(`/profile/${authUser.id}`);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setPostsLoading(true);
      try {
        // Fetch user data
        const userResponse = await axiosInstance.get(
          `/api/users/${userId || authUser.id}`
        );
        setUser(userResponse.data);
        setLoading(false);

        // Fetch posts separately
        try {
          const postsResponse = await axiosInstance.get(
            `/api/users/${userId || authUser.id}/posts`
          );
          const sortedPosts = postsResponse.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setPosts(sortedPosts);
        } catch (postError) {
          console.error("Error fetching posts:", postError);
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(
          error.response?.status === 404
            ? "User not found"
            : "Failed to load profile"
        );
        setLoading(false);
      } finally {
        setPostsLoading(false);
      }
    };

    if (authUser) {
      fetchData();
    }
  }, [userId, authUser, navigate]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  if (loading) {
    return (
      <>
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
          <div className="w-full max-w-4xl">
            {/* Skeleton for profile header */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 animate-pulse">
              <div className="h-48 bg-gray-200"></div>{" "}
              {/* Cover image skeleton */}
              <div className="p-6 flex flex-col md:flex-row items-center">
                <div className="w-32 h-32 rounded-full bg-gray-300 -mt-20 border-4 border-white"></div>
                <div className="md:ml-6 w-full mt-4 md:mt-0">
                  <div className="h-7 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
            </div>

            {/* Skeleton for posts */}
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md p-6 animate-pulse"
                >
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error && !user) {
    return (
      <>
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-md border border-red-100 max-w-md">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show not found state as a fallback
  if (!user) {
    return (
      <>
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
      <div className="bg-gray-50 min-h-screen pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Cover Image & Profile Header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500 w-full relative">
              {/* We could add actual cover image here if available */}
            </div>

            <div className="p-6 relative">
              <div className="flex flex-col md:flex-row">
                {/* Profile Picture */}
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden -mt-20 mx-auto md:mx-0">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`${user.firstName || ""} ${user.lastName || ""}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/150?text=${(
                          user.firstName ||
                          user.email ||
                          "U"
                        ).charAt(0)}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-indigo-300">
                      <span className="text-4xl font-semibold text-white">
                        {(user.firstName || user.email || "U").charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0 flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800">
                        {user.firstName || user.email?.split("@")[0]}{" "}
                        {user.lastName || ""}
                      </h1>
                      <p className="text-gray-600 mt-1">{user.email}</p>
                    </div>

                    {isOwnProfile && (
                      <button
                        onClick={() => navigate(`/edit-profile`)}
                        className="mt-4 md:mt-0 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {user.bio && (
                    <div className="mt-4 text-gray-700 bg-gray-50 p-4 rounded-lg">
                      <p>{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User's Posts */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 pl-4">
              {isOwnProfile ? "My Posts" : `${user?.firstName}'s Posts`}
            </h2>

            {postsLoading ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  <p className="text-gray-500 text-xl">
                    {isOwnProfile
                      ? "You haven't created any posts yet"
                      : "This user hasn't created any posts yet"}
                  </p>

                  {isOwnProfile && (
                    <button
                      onClick={() => navigate("/create-post")}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-200"
                    >
                      Create your first post
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
