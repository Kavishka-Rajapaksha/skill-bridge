import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axios";

function ReactionButton({ postId, userId, onReactionChange }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReactionStatus = useCallback(
    async (retries = 3) => {
      if (!postId || !userId) return;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const response = await axiosInstance.get("/api/reactions/status", {
            params: { userId, postId },
            timeout: 10000, // Increased timeout
          });

          if (response?.data) {
            setLiked(response.data.liked);
            setLikeCount(response.data.count);
            return;
          }
        } catch (error) {
          const isTimeout = error.code === "ECONNABORTED";
          const isNetworkError = !error.response;

          if (attempt === retries - 1 || (!isTimeout && !isNetworkError)) {
            console.error(
              "Error fetching reaction status:",
              error?.response?.data?.error || error.message
            );
            setLiked(false);
            setLikeCount(0);
            return;
          }
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    },
    [postId, userId]
  );

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    if (postId && userId) {
      fetchReactionStatus().catch((error) => {
        if (mounted) {
          console.error("Failed to fetch reaction status:", error);
        }
      });
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fetchReactionStatus]);

  const handleToggleLike = async () => {
    if (loading || !postId || !userId) return;
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/reactions/toggle", null, {
        params: { userId, postId },
        timeout: 10000, // Increased timeout
      });

      if (response?.data) {
        setLiked(response.data.liked);
        setLikeCount(response.data.count);
        if (onReactionChange) onReactionChange();
      }
    } catch (error) {
      console.error(
        "Error toggling reaction:",
        error?.response?.data?.error || error.message
      );
      // Refresh reaction status on error
      await fetchReactionStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 
        ${
          liked
            ? "text-blue-600 hover:bg-blue-50"
            : "text-gray-600 hover:bg-gray-100"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="flex items-center space-x-1">
        <svg
          className={`w-5 h-5 ${
            liked ? "fill-current" : "stroke-current fill-none"
          }`}
          viewBox="0 0 24 24"
        >
          <path
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-6.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{liked ? "Liked" : "Like"}</span>
      </span>
      {likeCount > 0 && (
        <span className="text-sm text-gray-500">{likeCount}</span>
      )}
    </button>
  );
}

export default ReactionButton;
