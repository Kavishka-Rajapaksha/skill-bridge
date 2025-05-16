import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Post from "../components/Post";
import { AuthContext } from "../context/AuthContext";
import { usePopup } from "../context/PopupContext";

// Simple cache for posts
const postCache = {};

function PostView() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const loadingTimerRef = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Create abort controller to handle cleanup
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    // Check cache first
    if (postCache[postId]) {
      setPost(postCache[postId]);
      setLoading(false);
      return;
    }
    
    // Set a delayed loading indicator
    loadingTimerRef.current = setTimeout(() => {
      if (!signal.aborted) {
        setLoading(true);
      }
    }, 300); // Only show loading after 300ms

    const fetchPost = async () => {
      try {
        setError(null);

        const response = await axiosInstance.get(`/api/posts/${postId}`, {
          signal: signal, // Pass the abort signal to axios
        });

        // Cache the result
        postCache[postId] = response.data;
        setPost(response.data);
        clearTimeout(loadingTimerRef.current);
        setLoading(false);
      } catch (err) {
        // Only set error if not aborted
        if (!signal.aborted) {
          console.error("Error fetching post:", err);
          
          // Retry logic for network errors
          if (err.message !== 'canceled' && !err.response && retryCount.current < MAX_RETRIES) {
            retryCount.current += 1;
            console.log(`Retrying... Attempt ${retryCount.current} of ${MAX_RETRIES}`);
            setTimeout(fetchPost, 1000 * retryCount.current); // Exponential backoff
            return;
          }
          
          setError(err.message || "Failed to load post");

          if (err.response?.status === 404) {
            showPopup({
              type: "error",
              message: "Post not found or has been deleted",
            });
          }
          clearTimeout(loadingTimerRef.current);
          setLoading(false);
        }
      }
    };

    fetchPost();

    // Cleanup function - this prevents the "CanceledError" when component unmounts
    return () => {
      abortController.abort();
      clearTimeout(loadingTimerRef.current);
    };
  }, [postId, isAuthenticated, navigate, showPopup]);

  // Function to force refresh the post data
  const refreshPost = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/posts/${postId}`);
      postCache[postId] = response.data;
      setPost(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to refresh post");
      setLoading(false);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPost(updatedPost);
    // Update cache with the updated post
    postCache[postId] = updatedPost;
  };

  const handlePostDeleted = () => {
    // Clear the post from cache when deleted
    delete postCache[postId];
    showPopup({
      type: "success",
      message: "Post has been deleted",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2 flex space-x-4">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Go back to home
                </button>
                <button
                  onClick={refreshPost}
                  className="text-sm font-medium text-blue-700 hover:text-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-700">Post not found</h2>
          <p className="mt-2 text-gray-500">
            The post may have been removed or you may have followed an invalid
            link.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-xl shadow-md">
        <Post
          post={post}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
          showFullContent={true}
          initialShowComments={true}
        />
      </div>
    </div>
  );
}

export default PostView;
