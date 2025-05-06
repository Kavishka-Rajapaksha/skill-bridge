import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

function ReactionButton({ postId, userId, onReactionChange }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactionStatus();
  }, [postId, userId]);

  const fetchReactionStatus = async () => {
    if (!postId || !userId) return;

    try {
      const response = await axiosInstance.get("/api/reactions/status", {
        params: { userId, postId },
        timeout: 5000,
      });

      if (response?.data) {
        setLiked(response.data.liked);
        setLikeCount(response.data.count);
      }
    } catch (error) {
      console.error(
        "Error fetching reaction status:",
        error?.response?.data?.error || error.message
      );
      setLiked(false);
      setLikeCount(0);
    }
  };

  const handleToggleLike = async () => {
    if (loading || !postId || !userId) return;
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/reactions/toggle", null, {
        params: { userId, postId },
        timeout: 5000,
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
