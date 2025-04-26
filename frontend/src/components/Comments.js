import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

function Comments({ postId, postOwnerId, showInput, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const abortController = new AbortController();

    const fetchComments = async () => {
      try {
        setFetchingComments(true);
        const response = await axiosInstance.get(
          `/api/comments/post/${postId}?limit=10`,
          {
            signal: abortController.signal,
          }
        );
        setComments(response.data); // response.data is now a direct array
        onCommentCountChange?.(response.data.length);
      } catch (error) {
        if (!error.name === "AbortError") {
          console.error("Error fetching comments:", error);
        }
      } finally {
        setFetchingComments(false);
      }
    };

    fetchComments();

    return () => {
      abortController.abort();
    };
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/comments", null, {
        params: {
          postId,
          userId: user.id,
          content: newComment.trim(),
        },
      });
      const updatedComments = [...comments, response.data];
      setComments(updatedComments);
      onCommentCountChange?.(updatedComments.length);
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to create comment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (commentId, content) => {
    try {
      const response = await axiosInstance.put(
        `/api/comments/${commentId}`,
        null,
        {
          params: {
            userId: user.id,
            content: content.trim(),
          },
        }
      );
      setComments(
        comments.map((c) => (c.id === commentId ? response.data : c))
      );
      setEditingComment(null);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await axiosInstance.delete(`/api/comments/${commentId}`, {
        params: { userId: user.id },
      });
      const updatedComments = comments.filter((c) => c.id !== commentId);
      setComments(updatedComments);
      onCommentCountChange?.(updatedComments.length);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="mt-4">
      {showInput && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={loading}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                {newComment.length}/500
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 min-w-[100px] font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      )}

      {fetchingComments ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-lg shadow-inner">
                      {comment.userProfilePicture ? (
                        <img
                          src={comment.userProfilePicture}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{comment.userName?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt !== comment.createdAt && (
                            <span className="italic ml-1">(edited)</span>
                          )}
                        </span>
                      </div>

                      {editingComment === comment.id ? (
                        <div className="mt-2">
                          <input
                            type="text"
                            defaultValue={comment.content}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(comment.id, e.target.value);
                              } else if (e.key === "Escape") {
                                setEditingComment(null);
                              }
                            }}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Enter
                            </span>{" "}
                            to save
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Esc
                            </span>{" "}
                            to cancel
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-gray-700">{comment.content}</p>
                      )}
                    </div>
                  </div>

                  {(user.id === comment.userId || user.id === postOwnerId) && (
                    <div className="flex items-center gap-2">
                      {user.id === comment.userId && (
                        <button
                          onClick={() => setEditingComment(comment.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-medium text-sm"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Comments;
