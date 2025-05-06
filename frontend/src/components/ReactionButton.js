import React, { useState, useEffect, useRef } from "react";
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
  const requestQueue = useRef([]);
  const processingQueue = useRef(false);
  const abortController = useRef(null);
  const mounted = useRef(true);
  const timeout = useRef(null);

  useEffect(() => {
    if (postId && userId) {
      fetchReactions();
      fetchCurrentUserReaction();
    }
  }, [postId, userId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timeout.current);
      if (abortController.current) {
        abortController.current.abort();
      }
      // Clear the queue on unmount
      requestQueue.current = [];
      processingQueue.current = false;
    };
  }, []);

  const enqueueRequest = (request) => {
    if (!mounted.current) return;

    // Debounce requests
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      requestQueue.current.push(request);
      processQueue();
    }, 100);
  };

  const processQueue = async () => {
    if (
      processingQueue.current ||
      requestQueue.current.length === 0 ||
      !mounted.current
    )
      return;

    processingQueue.current = true;
    let currentRequest;

    try {
      while (requestQueue.current.length > 0 && mounted.current) {
        currentRequest = requestQueue.current[0];
        try {
          await currentRequest();
          requestQueue.current.shift();
          if (mounted.current && requestQueue.current.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
            console.log("Request was canceled, clearing queue");
            requestQueue.current = [];
            break;
          } else if (error.code === "ECONNABORTED") {
            console.log("Request timed out, retrying...");
            continue;
          }
          console.error("Request failed:", error);
          requestQueue.current.shift();
        }
      }
    } finally {
      processingQueue.current = false;
    }
  };

  const fetchWithRetry = async (
    requestFn,
    maxRetries = 3,
    initialDelay = 1000
  ) => {
    if (!mounted.current) return;

    // Cancel any existing request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let delay = initialDelay;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        if (!mounted.current) {
          throw new Error("Component unmounted");
        }
        return await requestFn(abortController.current.signal);
      } catch (error) {
        lastError = error;
        if (
          !mounted.current ||
          error.name === "AbortError" ||
          error.code === "ERR_CANCELED"
        ) {
          console.log("Request was canceled or component unmounted");
          throw error;
        }
        if (i === maxRetries - 1) break;
        if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
          console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
          continue;
        }
        throw error;
      }
    }
    console.error("Max retries reached:", lastError);
    throw lastError;
  };

  const fetchReactions = async () => {
    try {
      enqueueRequest(async () => {
        const response = await fetchWithRetry((signal) =>
          axiosInstance.get(`/api/reactions/post/${postId}`, {
            timeout: 8000,
            signal,
          })
        );
        if (response?.data) {
          setReactionStats(response.data);
        }
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching reactions:", error);
        setReactionStats({ total: 0, reactions: {} });
      }
    }
  };

  const fetchCurrentUserReaction = async () => {
    try {
      enqueueRequest(async () => {
        const response = await fetchWithRetry((signal) =>
          axiosInstance.get(`/api/reactions/user`, {
            params: { userId, postId },
            timeout: 8000,
            signal,
          })
        );
        if (response?.data) {
          setCurrentReaction(response.data.type);
        }
      });
    } catch (error) {
      if (error.name !== "AbortError" && error.response?.status !== 404) {
        console.error("Error fetching user's reaction:", error);
      }
      setCurrentReaction(null);
    }
  };

  const handleReaction = async (reaction) => {
    if (!postId || !userId || loading) return;

    try {
      setLoading(true);
      enqueueRequest(async () => {
        if (currentReaction === reaction) {
          await fetchWithRetry((signal) =>
            axiosInstance.delete("/api/reactions", {
              params: { userId, postId },
              timeout: 8000,
              signal,
            })
          );
          setCurrentReaction(null);
        } else {
          await fetchWithRetry((signal) =>
            axiosInstance.post("/api/reactions", null, {
              params: { userId, postId, type: reaction },
              timeout: 8000,
              signal,
            })
          );
          setCurrentReaction(reaction);
        }
      });

      await fetchReactions();
      setShowReactions(false);
      if (onReactionChange) onReactionChange();
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error handling reaction:", error);
        const errorMessage =
          error.response?.data?.message || error.code === "ECONNABORTED"
            ? "Request timed out. Please try again."
            : "Failed to update reaction";
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
