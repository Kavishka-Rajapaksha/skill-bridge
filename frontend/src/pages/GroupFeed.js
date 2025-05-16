import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Post from "../components/Post";

function GroupFeed() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Get group details
  useEffect(() => {
    const abortController = new AbortController();

    const fetchGroup = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/groups/${groupId}`, {
          signal: abortController.signal,
        });
        setGroup(response.data);
      } catch (error) {
        if (error.name === "CanceledError") {
          console.log("Request was canceled");
          return;
        }
        console.error("Error fetching group:", error);
        setError(error.response?.data?.message || "Failed to load group");
        if (error.response?.status === 404) {
          navigate("/groups");
        }
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroup();
    }

    return () => {
      abortController.abort(); // Cleanup on unmount
    };
  }, [groupId, navigate]);

  // Fetch group posts
  useEffect(() => {
    const abortController = new AbortController();

    const fetchGroupPosts = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/groups/${groupId}/posts`,
          {
            signal: abortController.signal,
          }
        );

        if (response.data && Array.isArray(response.data)) {
          // Create a Map to track unique posts by ID
          const uniquePostsMap = new Map();

          // Process posts to handle shared posts and ensure uniqueness
          response.data.forEach((post) => {
            // For posts with same ID, only keep the most recent one
            if (
              !uniquePostsMap.has(post.id) ||
              uniquePostsMap.get(post.id).createdAt < post.createdAt
            ) {
              // Make sure shared posts have proper display names
              if (post.sharedFrom) {
                if (!post.originalUserName && post.originalUserId) {
                  post.originalUserName = `User ${post.originalUserId.substring(
                    0,
                    6
                  )}`;
                }

                if (!post.sharedByUserName && post.sharedByUserId) {
                  post.sharedByUserName = `User ${post.sharedByUserId.substring(
                    0,
                    6
                  )}`;
                }
              }

              uniquePostsMap.set(post.id, post);
            }
          });

          // Convert Map back to array
          const processedPosts = Array.from(uniquePostsMap.values());

          setPosts(processedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching group posts:", error);
        setPosts([]);
      }
    };

    if (groupId) {
      fetchGroupPosts();
    }

    return () => {
      abortController.abort();
    };
  }, [groupId]);

  const handleNewPost = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Scroll to top where post form would be, or navigate to create post page
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Alternative: navigate to a dedicated post creation page
    // navigate(`/group/${groupId}/create-post`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 border-opacity-20 rounded-full"></div>
              <div className="animate-spin absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">
              Loading group...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/groups")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="relative">
        {/* Cover Image/Gradient */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        {/* Group Info Overlay */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-24 bg-white rounded-t-3xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Group Avatar */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-xl shadow-lg -mt-12 flex items-center justify-center border-4 border-white">
                <span className="text-4xl font-bold text-white">
                  {group?.name?.charAt(0) || "G"}
                </span>
              </div>

              {/* Group Details */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {group?.name}
                    </h1>
                    <p className="mt-1 text-gray-600 text-lg">
                      {group?.description}
                    </p>
                  </div>
                </div>

                {/* Group Stats */}
                <div className="flex items-center gap-6 mt-4 text-gray-500">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>{posts.length} posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span>
                      Created {new Date(group?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Removed members tab */}
            <div className="border-b border-gray-200 mt-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`${
                    activeTab === "posts"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <svg
                    className="mr-2 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`${
                    activeTab === "about"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <svg
                    className="mr-2 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  About
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-3xl mx-auto">
          {activeTab === "posts" && (
            <div className="space-y-6 animate-fadeIn">
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No content has been shared in this group yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="transform transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Post
                        post={post}
                        onPostUpdated={(updatedPost) => {
                          setPosts((prevPosts) =>
                            prevPosts.map((p) =>
                              p.id === updatedPost.id ? updatedPost : p
                            )
                          );
                        }}
                        onPostDeleted={(postId) => {
                          setPosts((prevPosts) =>
                            prevPosts.filter((p) => p.id !== postId)
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-white rounded-xl shadow-md p-6 animate-fadeIn">
              <h3 className="text-xl font-semibold mb-4">About this Group</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Description</h4>
                  <p className="mt-1 text-gray-600">{group?.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Created</h4>
                  <p className="mt-1 text-gray-600">
                    {new Date(group?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}

export default GroupFeed;
