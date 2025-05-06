import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Add refs for request cancellation
  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Add cache ref
  const requestCacheRef = useRef(new Map());
  const isMountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const fetchData = useCallback(async () => {
    if (!postId || !userId) return;

    // Check cache first
    const cacheKey = `${postId}-${userId}`;
    const cached = requestCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5000) {
      setReactionStats(cached.stats);
      setCurrentReaction(cached.reaction);
      return;
    }

    cleanup();
    abortControllerRef.current = new AbortController();

    try {
      // First get stats which always exists
      const statsResponse = await axiosInstance.get(
        `/api/reactions/${postId}/stats`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!isMountedRef.current) return;

      const newStats = {
        total: statsResponse.data?.total || 0,
        reactions: statsResponse.data?.reactions || {},
      };

      setReactionStats(newStats);

      // Then try to get user reaction only if stats show reactions exist
      if (newStats.total > 0) {
        try {
          const userResponse = await axiosInstance.get(
            `/api/reactions/${postId}/user/${userId}`,
            {
              signal: abortControllerRef.current.signal,
            }
          );

          if (userResponse.data?.type && isMountedRef.current) {
            setCurrentReaction(userResponse.data.type);
          }
        } catch (error) {
          // Silently handle 404 for user reaction
          if (error.response?.status !== 404) {
            console.warn("Non-critical error fetching user reaction:", error);
          }
          if (isMountedRef.current) {
            setCurrentReaction(null);
          }
        }
      }

      // Update cache
      requestCacheRef.current.set(cacheKey, {
        stats: newStats,
        reaction: null,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      if (error.name !== "AbortError") {
        console.error("Error fetching reaction data:", error);
        setReactionStats({ total: 0, reactions: {} });
        setCurrentReaction(null);
      }
    }
  }, [postId, userId, cleanup]);

  // Add a delay to prevent rapid requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (postId && userId) {
        fetchData();
      }
    }, 1000); // Increased delay to 1 second

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [postId, userId, fetchData, cleanup]);

  const handleReaction = async (reaction) => {
    if (!postId || !userId || loading) return;

    cleanup(); // Cancel any pending requests
    setLoading(true);

    try {
      let response;

      if (currentReaction === reaction) {
        response = await axiosInstance
          .delete(`/api/reactions/${postId}/user/${userId}`)
          .catch((error) => {
            // Treat 404 as successful deletion
            if (error.response?.status === 404) {
              return { data: { total: 0, reactions: {} } };
            }
            throw error;
          });
      } else {
        response = await axiosInstance.post(`/api/reactions/${postId}`, {
          userId,
          type: reaction,
        });
      }

      if (response.data) {
        setReactionStats({
          total: response.data.total || 0,
          reactions: response.data.reactions || {},
        });
        setCurrentReaction(currentReaction === reaction ? null : reaction);
      }

      if (onReactionChange) onReactionChange();
      setShowReactions(false);
    } catch (error) {
      // Only show error for non-404 responses
      if (error.response?.status !== 404) {
        const errorMessage =
          error.response?.data?.error ||
          "Failed to update reaction. Please try again.";
        alert(errorMessage);
      }
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
        {currentReaction && (
          <span className="text-lg">{reactions[currentReaction]?.emoji}</span>
        )}
        <span className="text-sm text-gray-500">
          {reactionStats.total > 0 && reactionStats.total}
        </span>
      </button>

      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 flex space-x-2 z-50">
          {Object.entries(reactions).map(([key, { emoji, label }]) => (
            <button
              key={key}
              className={`hover:scale-125 transform transition-transform p-1 ${
                currentReaction === key ? "bg-blue-50 rounded" : ""
              }`}
              onClick={() => handleReaction(key)}
              title={label}
            >
              <span className="text-xl">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReactionButton;
