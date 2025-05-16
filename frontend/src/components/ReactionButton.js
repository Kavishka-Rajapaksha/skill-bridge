import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import WebSocketService from "../services/WebSocketService";

function ReactionButton({ postId, userId, onReactionChange, renderButton }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState(null);

  useEffect(() => {
    const checkReactionStatus = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/reactions/status?postId=${postId}&userId=${userId}`
        );
        setLiked(response.data.liked);
        setCount(response.data.count);
      } catch (error) {
        console.error("Error checking reaction status:", error);
      }
    };

    if (postId && userId) {
      checkReactionStatus();
    }
  }, [postId, userId]);

  useEffect(() => {
    const callback = (update) => {
      if (update.postId === postId) {
        // Only update if this is a server-confirmed update (not our optimistic one)
        // or if we had an optimistic update that needs to be reconciled
        if (!optimisticUpdate || Date.now() - optimisticUpdate > 7000) {
          setLiked(update.userLiked);
          setCount(update.reactionCount);
          setLoading(false);
          setOptimisticUpdate(null);
        }
      }
    };

    WebSocketService.setReactionCallback(callback);

    return () => {
      // Clean up by setting an empty callback if component unmounts
      WebSocketService.setReactionCallback(() => {});
    };
  }, [postId, optimisticUpdate]);

  const handleReaction = async () => {
    if (loading) return;

    try {
      // Optimistically update UI immediately
      const newLikedState = !liked;
      const newCount = newLikedState ? count + 1 : Math.max(0, count - 1);

      setLiked(newLikedState);
      setCount(newCount);
      setLoading(true);
      setOptimisticUpdate(Date.now());

      // Notify parent about the change
      if (onReactionChange) {
        onReactionChange({ liked: newLikedState, count: newCount });
      }

      // Send actual request in the background
      await axiosInstance.post("/api/reactions/toggle", null, {
        params: { userId, postId },
      });

      // Success! Keep the optimistic update
      setLoading(false);

      // We'll let WebSocket reconcile any inconsistencies if needed
    } catch (error) {
      console.error("Error toggling reaction:", error);
      // Revert optimistic update on error
      setLiked(!liked);
      setCount(liked ? count + 1 : Math.max(0, count - 1));
      setLoading(false);
      setOptimisticUpdate(null);

      // Also notify parent about the revert
      if (onReactionChange) {
        onReactionChange({
          liked,
          count: liked ? count + 1 : Math.max(0, count - 1),
        });
      }
    }
  };

  // If a custom render function is provided, use it
  if (renderButton) {
    return renderButton({
      liked,
      count,
      onClick: handleReaction,
      loading,
    });
  }

  // Default button render
  return (
    <button
      onClick={handleReaction}
      disabled={loading}
      className={`flex items-center space-x-2 ${
        liked ? "text-blue-600" : "text-gray-500 hover:text-blue-500"
      }`}
    >
      <svg
        className={`w-6 h-6 transition-transform duration-200 ${
          liked ? "scale-110" : ""
        }`}
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}

export default ReactionButton;
