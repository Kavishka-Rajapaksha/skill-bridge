import React, { useState, useEffect, useCallback, useRef } from "react";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import Header from "../components/Header";
import axiosInstance from "../utils/axios";
import { useNavigate } from "react-router-dom";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const fetchTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);
  const [silentRefresh, setSilentRefresh] = useState(false);

  const fetchUserData = async () => {
    try {
      // Check for stored user data instead of just the token
      const userData = localStorage.getItem("user");
      if (!userData) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(userData);
      setUser(user);

      // Optionally validate token on backend or refresh user data
      // const response = await axiosInstance.get("/api/users/me");
      // setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  // Add debug function to inspect CreatePost issues
  const debugCreatePost = (formData) => {
    console.group("Create Post Debug Info");
    console.log("User ID:", user?.id);
    console.log("Token present:", !!localStorage.getItem("token"));
    console.log("Form data:", formData);
    console.groupEnd();

    // Return user information for post creation
    return {
      userId: user?.id,
      token: localStorage.getItem("token"),
    };
  };

  const fetchPosts = useCallback(
    async (silent = false) => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;

        if (silent) {
          setSilentRefresh(true);
        } else {
          console.log("Fetching posts...");
        }

        const response = await axiosInstance.get("/api/posts");

        if (silent) {
          console.log("Silent refresh completed");
        } else {
          console.log("Posts API response:", response.data);
        }

        // Filter out shared posts from the response
        const processedPosts = response.data
          .filter((post) => !post.sharedFrom) // Only show non-shared posts
          .map((post) => {
            if (!post.userName || post.userName === "Deleted User") {
              if (post.userFirstName || post.userLastName) {
                post.userName = `${post.userFirstName || ""} ${
                  post.userLastName || ""
                }`.trim();
              }
            }
            return post;
          });

        // Compare old and new posts to see if we should update state
        if (silent) {
          const currentPostIds = posts.map((p) => p.id);
          const newPostIds = processedPosts.map((p) => p.id);

          // Check if there are new posts or if post order changed
          const hasNewPosts = newPostIds.some(
            (id) => !currentPostIds.includes(id)
          );
          const postOrderChanged = !newPostIds.every(
            (id, index) => currentPostIds[index] === id
          );

          if (hasNewPosts || postOrderChanged) {
            setPosts(processedPosts);
          }
        } else {
          setPosts(processedPosts);
        }
      } catch (error) {
        if (!silent) {
          console.error("Error fetching posts:", error);
          if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
          }
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);

        // Reset silent refresh flag after a short delay
        if (silent) {
          setTimeout(() => setSilentRefresh(false), 100);
        }
      }
    },
    [posts]
  );

  useEffect(() => {
    fetchUserData();
    fetchPosts();

    // Set up periodic silent refresh
    const intervalId = setInterval(() => {
      fetchPosts(true); // Silent refresh
    }, 120000); // Every 2 minutes

    return () => {
      clearInterval(intervalId);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const handlePostCreated = (newPost) => {
    console.log("New post created:", newPost);

    if (!newPost || typeof newPost !== "object") {
      console.error("Invalid post object returned:", newPost);
      alert("Failed to create post: Invalid response format");
      return;
    }

    // Ensure the new post has correct user information
    if (!newPost.userName || newPost.userName === "Deleted User") {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser) {
        newPost.userName = `${currentUser.firstName || ""} ${
          currentUser.lastName || ""
        }`.trim();
        console.log("Updated post with user name:", newPost.userName);
      }
    }

    // Ensure post has an id before adding to state
    if (!newPost.id) {
      console.warn("Created post missing ID, generating temporary ID");
      newPost.id = `temp-${Date.now()}`;
    }

    setPosts((prevPosts) => [newPost, ...prevPosts]);
    console.log("Posts state updated. Total posts:", posts.length + 1);

    // Use a debounced refresh to update from server
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchPosts(true); // Silent refresh
    }, 3000);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = useCallback((updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id
          ? { ...post, ...updatedPost, quietUpdate: true }
          : post
      )
    );

    // Clean up the quietUpdate flag after a moment
    setTimeout(() => {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === updatedPost.id ? { ...post, quietUpdate: false } : post
        )
      );
    }, 100);
  }, []);

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <CreatePost
            onPostCreated={handlePostCreated}
            debugFn={debugCreatePost}
            user={user}
          />
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">
                No posts available. Be the first to create a post!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;
