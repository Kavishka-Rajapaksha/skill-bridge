import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

const reactions = {
  LIKE: { emoji: "👍", label: "Like" },
  LOVE: { emoji: "❤️", label: "Love" },
  HAHA: { emoji: "😆", label: "Haha" },
  WOW: { emoji: "😮", label: "Wow" },
  SAD: { emoji: "😢", label: "Sad" },
  ANGRY: { emoji: "😠", label: "Angry" },
};

function ReactionButton({ postId, userId, onReactionChange }) {
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [reactionStats, setReactionStats] = useState({
    total: 0,
    reactions: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId && userId) {
      fetchReactions();
      fetchCurrentUserReaction();
    }
  }, [postId, userId]);

  const fetchReactions = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/reactions/${postId}/stats`
      );
      if (response.data) {
        setReactionStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
      // Set default empty state
      setReactionStats({ total: 0, reactions: {} });
    }
  };

  const fetchCurrentUserReaction = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/reactions/${postId}/user/${userId}`
      );
      if (response.data) {
        setCurrentReaction(response.data.type);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching user's reaction:", error);
      }
      setCurrentReaction(null);
    }
  };

  const handleReaction = async (reaction) => {
    if (!postId || !userId || loading) return;

    try {
      setLoading(true);
      if (currentReaction === reaction) {
        // Remove reaction
        await axiosInstance.delete(`/api/reactions/${postId}/user/${userId}`);
        setCurrentReaction(null);
      } else {
        // Add/update reaction
        await axiosInstance.post(`/api/reactions/${postId}`, {
          userId,
          type: reaction,
        });
        setCurrentReaction(reaction);
      }

      await fetchReactions();
      setShowReactions(false);
      if (onReactionChange) onReactionChange();
    } catch (error) {
      console.error("Error handling reaction:", error);
      alert("Failed to update reaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 hover:bg-gray-100 px-3 py-1 rounded-md"
        onClick={() => setShowReactions(!showReactions)}
      >
        <span>{currentReaction && reactions[currentReaction].emoji}</span>
        <span className="text-sm text-gray-500">
          {reactionStats.total > 0 && `${reactionStats.total}`}
        </span>
      </button>

      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 flex space-x-2">
          {Object.entries(reactions).map(([key, { emoji, label }]) => (
            <button
              key={key}
              className="hover:scale-125 transform transition-transform p-1"
              onClick={() => handleReaction(key)}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReactionButton;
