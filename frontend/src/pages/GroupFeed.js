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
  const navigate = useNavigate();

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

  useEffect(() => {
    const abortController = new AbortController();

    const fetchGroupPosts = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/groups/${groupId}/posts`,
          { signal: abortController.signal }
        );

        // Enhanced processing for shared posts
        const processedPosts = (response.data || []).map((post) => {
          if (post.sharedFrom) {
            return {
              ...post,
              isShared: true,
              // Original post details (maintain original data)
              originalUserName: post.originalUserName,
              originalUserProfilePicture: post.originalUserProfilePicture,
              originalCreatedAt: post.originalCreatedAt,
              // Sharing user details (maintain sharing data)
              sharedByUserName: post.sharedByUserName,
              sharedByUserProfilePicture: post.sharedByUserProfilePicture,
              sharedByUserId: post.sharedByUserId,
              sharedAt: post.sharedAt,
              // Current post details
              userName: post.userName,
              userProfilePicture: post.userProfilePicture,
              userId: post.userId,
            };
          }
          return post;
        });

        // Sort posts by creation/shared date
        const sortedPosts = processedPosts.sort((a, b) => {
          const dateA = a.sharedAt || a.createdAt;
          const dateB = b.sharedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        });

        setPosts(sortedPosts);
      } catch (error) {
        if (error.name === "CanceledError") {
          console.log("Request was canceled");
          return;
        }
        console.error("Error fetching group posts:", error);
        setError(error.response?.data?.message || "Failed to load group posts");
      }
    };

    if (groupId) {
      fetchGroupPosts();
    }

    return () => {
      abortController.abort(); // Cleanup on unmount
    };
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Group Header */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{group?.name}</h1>
          <p className="mt-2 text-gray-600">{group?.description}</p>
        </div>

        {/* Group Feed Content */}
        <div className="space-y-6 mt-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              No posts in this group yet.
            </div>
          ) : (
            posts.map((post) => (
              <Post
                key={post.id}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupFeed;
