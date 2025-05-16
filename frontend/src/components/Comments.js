import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosInstance from "../utils/axios";

function Comments({
  postId,
  postOwnerId,
  showInput,
  onCommentCountChange,
  cachedComments,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const [replyToComment, setReplyToComment] = useState(null);
  const [showRepliesFor, setShowRepliesFor] = useState({});
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [reactingToComment, setReactingToComment] = useState(null);

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionResults, setShowMentionResults] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const mentionInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ROLE_ADMIN";

  const replyInputRef = useRef(null);

  useEffect(() => {
    if (replyToComment && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyToComment]);

  const fetchComments = async () => {
    try {
      setFetchingComments(true);
      const response = await axiosInstance.get(
        `/api/comments/post/${postId}?limit=100&includeReplies=true&hierarchical=true&currentUserId=${
          user?.id || ""
        }`
      );

      if (response.data && Array.isArray(response.data)) {
        const processedComments = processCommentsAndReplies(response.data);
        setComments(processedComments);

        const totalComments = countTotalComments(processedComments);
        onCommentCountChange?.(totalComments);

        const repliesMap = {};
        processedComments.forEach((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            repliesMap[comment.id] = true;
          }
        });
        setShowRepliesFor(repliesMap);
      } else {
        console.error("Unexpected response format:", response.data);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setFetchingComments(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    if (postId) {
      fetchComments();
    }

    return () => {
      abortController.abort();
    };
  }, [postId]);

  useEffect(() => {
    if (showInput) {
      fetchComments();
    }
  }, [showInput, postId]);

  useEffect(() => {
    if (cachedComments) {
      const processedComments = processCommentsAndReplies(cachedComments);
      setComments(processedComments);
      const totalComments = countTotalComments(processedComments);
      onCommentCountChange?.(totalComments);
    } else {
      fetchComments();
    }
  }, [postId, cachedComments]);

  const processCommentsAndReplies = (commentsData) => {
    const parentComments = [];
    const replyMap = {};

    commentsData.forEach((comment) => {
      if (comment.parentCommentId) {
        if (!replyMap[comment.parentCommentId]) {
          replyMap[comment.parentCommentId] = [];
        }
        replyMap[comment.parentCommentId].push(comment);
      } else {
        if (!comment.replies) {
          comment.replies = [];
        }
        parentComments.push(comment);
      }
    });

    parentComments.forEach((parent) => {
      if (replyMap[parent.id]) {
        parent.replies = replyMap[parent.id].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }
    });

    return parentComments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  const countTotalComments = (commentsWithReplies) => {
    let count = 0;
    commentsWithReplies.forEach((comment) => {
      count++;
      count += comment.replies.length;
    });
    return count;
  };

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    // Look for mention pattern
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      if (query.length > 0) {
        searchUsers(query);
        setShowMentionResults(true);
      } else {
        setShowMentionResults(false);
      }
    } else {
      setShowMentionResults(false);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setMentionResults([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/api/users/search?query=${query}`
      );
      setMentionResults(response.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setMentionResults([]);
    }
  };

  const insertMention = (user) => {
    const beforeMention = newComment.substring(0, newComment.lastIndexOf("@"));
    const afterMention = newComment.substring(
      newComment.lastIndexOf("@") + mentionQuery.length + 1
    );

    const updatedComment = `${beforeMention}@${user.firstName}${
      user.lastName ? user.lastName : ""
    } ${afterMention}`;
    setNewComment(updatedComment);

    // Add user to mentioned users list
    setMentionedUsers([
      ...mentionedUsers,
      {
        id: user.id,
        name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
      },
    ]);

    setShowMentionResults(false);
    mentionInputRef.current?.focus();
  };

  const extractMentions = (text) => {
    const mentionRegex = /@([a-zA-Z0-9]+[a-zA-Z0-9]*)/g;
    const matches = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);

      // Extract mentions from comment text
      const extractedMentions = mentionedUsers.map((user) => user.id);

      const response = await axiosInstance.post("/api/comments", null, {
        params: {
          postId,
          userId: user.id,
          content: newComment.trim(),
          parentCommentId: null,
          mentions: extractedMentions.join(","),
        },
      });

      const newCommentObj = { ...response.data, replies: [] };
      const updatedComments = [newCommentObj, ...comments];
      setComments(updatedComments);
      onCommentCountChange?.(countTotalComments(updatedComments));
      setNewComment("");
      setMentionedUsers([]);
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Failed to create comment");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);

      // Extract mentions from reply text
      const extractedMentions = extractMentions(replyContent)
        .map((mention) =>
          mentionedUsers.find(
            (u) =>
              u.name.replace(" ", "").toLowerCase() === mention.toLowerCase()
          )
        )
        .filter(Boolean)
        .map((user) => user.id);

      const response = await axiosInstance.post("/api/comments", null, {
        params: {
          postId,
          userId: user.id,
          content: replyContent.trim(),
          parentCommentId: parentId,
          mentions: extractedMentions.join(","),
        },
      });

      const newReply = {
        ...response.data,
        parentCommentId: parentId,
      };

      const updatedComments = comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...comment.replies, newReply],
          };
        }
        return comment;
      });

      setComments(updatedComments);
      onCommentCountChange?.(countTotalComments(updatedComments));
      setReplyContent("");
      setReplyToComment(null);
      setMentionedUsers([]);

      setShowRepliesFor({
        ...showRepliesFor,
        [parentId]: true,
      });

      setExpandedReplies({
        ...expandedReplies,
        [parentId]: true,
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      alert("Failed to create reply");
    } finally {
      setSubmittingReply(false);
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

      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, ...response.data };
        } else if (comment.replies.some((reply) => reply.id === commentId)) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId ? { ...reply, ...response.data } : reply
            ),
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setEditingComment(null);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleDelete = async (
    commentId,
    isAdminDelete = false,
    parentId = null
  ) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      setDeletingCommentId(commentId);
      await axiosInstance.delete(`/api/comments/${commentId}`, {
        params: {
          userId: user.id,
          isAdmin: isAdminDelete,
        },
      });

      let updatedComments;

      if (parentId) {
        updatedComments = comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(
                (reply) => reply.id !== commentId
              ),
            };
          }
          return comment;
        });
      } else {
        updatedComments = comments.filter((c) => c.id !== commentId);
      }

      setComments(updatedComments);
      onCommentCountChange?.(countTotalComments(updatedComments));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleReaction = async (
    commentId,
    isParentComment = true,
    parentId = null
  ) => {
    if (!user) return;

    try {
      setReactingToComment(commentId);
      const response = await axiosInstance.post(
        `/api/comments/${commentId}/react`,
        null,
        {
          params: {
            userId: user.id,
            reactionType: "like",
          },
        }
      );

      let updatedComments = [...comments];

      if (isParentComment) {
        updatedComments = updatedComments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likeCount: response.data.likeCount,
              userLiked: response.data.userLiked,
            };
          }
          return comment;
        });
      } else if (parentId) {
        updatedComments = updatedComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map((reply) => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    likeCount: response.data.likeCount,
                    userLiked: response.data.userLiked,
                  };
                }
                return reply;
              }),
            };
          }
          return comment;
        });
      }

      setComments(updatedComments);
    } catch (error) {
      console.error("Error reacting to comment:", error);
    } finally {
      setReactingToComment(null);
    }
  };

  const toggleReplies = (commentId) => {
    setShowRepliesFor((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    if (!showRepliesFor[commentId]) {
      setExpandedReplies((prev) => ({
        ...prev,
        [commentId]: true,
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const LikeButton = ({
    comment,
    onClick,
    isReply = false,
    parentId = null,
  }) => {
    const isLoading = reactingToComment === comment.id;
    const liked = comment.userLiked || false;
    const count = comment.likeCount || 0;

    return (
      <button
        onClick={() => onClick(comment.id, !isReply, isReply ? parentId : null)}
        disabled={isLoading}
        className={`group flex items-center space-x-1 text-sm px-2 py-1 rounded-full transition-all duration-200 ${
          liked
            ? "text-red-500 hover:bg-red-50"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <>
            <div className="relative">
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  liked ? "scale-110 fill-current" : "fill-none"
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={liked ? "0" : "2"}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>

              {liked && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-500 absolute animate-ping opacity-75"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </span>
              )}
            </div>
            <span className="font-medium text-xs">
              {count > 0 ? count : liked ? "1" : "Like"}
            </span>
          </>
        )}
      </button>
    );
  };

  const renderReplies = (parentComment) => {
    if (!showRepliesFor[parentComment.id] || !parentComment.replies.length)
      return null;

    return (
      <div className="pl-12 mt-3 space-y-3">
        {parentComment.replies.map((reply) => (
          <div
            key={reply.id}
            className="group bg-gray-50 p-3 rounded-lg border-l-2 border-blue-200 hover:border-blue-400 transition-colors duration-200"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-2 flex-1">
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 p-[1.5px]">
                  {reply.userProfilePicture ? (
                    <img
                      src={reply.userProfilePicture}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                      {reply.userName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-gray-800 text-sm">
                      {reply.userName}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(reply.createdAt)}
                      {reply.updatedAt !== reply.createdAt && (
                        <span className="inline-flex items-center ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          edited
                        </span>
                      )}
                    </span>
                  </div>

                  {editingComment === reply.id ? (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        defaultValue={reply.content}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(reply.id, e.target.value);
                          } else if (e.key === "Escape") {
                            setEditingComment(null);
                          }
                        }}
                        className="w-full p-2 pr-12 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                        autoFocus
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                          Enter
                        </kbd>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm mt-1">
                      {renderCommentWithMentions(reply.content)}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <LikeButton
                      comment={reply}
                      onClick={handleReaction}
                      isReply={true}
                      parentId={parentComment.id}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {user.id === reply.userId && (
                  <>
                    <button
                      onClick={() => setEditingComment(reply.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                      title="Edit reply"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(reply.id, false, parentComment.id)
                      }
                      disabled={deletingCommentId === reply.id}
                      className={`p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 ${
                        deletingCommentId === reply.id ? "animate-pulse" : ""
                      }`}
                      title="Delete reply"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {(isAdmin || user.id === postOwnerId) &&
                  user.id !== reply.userId && (
                    <button
                      onClick={() =>
                        handleDelete(reply.id, isAdmin, parentComment.id)
                      }
                      disabled={deletingCommentId === reply.id}
                      className={`p-1 relative group/admin hover:bg-red-50 rounded-full transition-all duration-200 ${
                        deletingCommentId === reply.id ? "animate-pulse" : ""
                      }`}
                      title={
                        isAdmin ? "Delete as Admin" : "Delete as Post Owner"
                      }
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-500 group-hover/admin:text-red-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}

        {expandedReplies[parentComment.id] && (
          <div className="pt-2">
            <form
              className="flex items-center space-x-2"
              onSubmit={(e) => handleReplySubmit(e, parentComment.id)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-blue-500">
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={
                    replyToComment === parentComment.id ? replyContent : ""
                  }
                  onChange={(e) => setReplyContent(e.target.value)}
                  onClick={() => setReplyToComment(parentComment.id)}
                  placeholder="Add a reply..."
                  className="w-full pl-3 pr-16 py-2 bg-gray-100 hover:bg-white focus:bg-white rounded-full text-sm border border-transparent focus:border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                />
                {replyToComment === parentComment.id && (
                  <button
                    type="submit"
                    disabled={submittingReply || !replyContent.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {submittingReply ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 transition-transform duration-200 transform rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h4a1 1 0 00.894-1.447l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  const renderMentionDropdown = () => {
    if (!showMentionResults || mentionResults.length === 0) return null;

    return (
      <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg overflow-hidden border border-gray-200">
        <ul className="max-h-60 overflow-auto">
          {mentionResults.map((user) => (
            <li
              key={user.id}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
              onClick={() => insertMention(user)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.firstName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-blue-500">
                    {user?.firstName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <span className="font-medium">
                {user.firstName} {user.lastName}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderCommentWithMentions = (text) => {
    if (!text) return null;

    // Split by mention pattern
    const parts = text.split(/(@[a-zA-Z0-9]+[a-zA-Z0-9]*)/g);

    return parts.map((part, index) => {
      // If this part is a mention (starts with @)
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-blue-600 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    console.log(`Comments for post ${postId}:`, comments);
  }, [comments, postId]);

  return (
    <div className="mt-4">
      {!fetchingComments && comments.length === 0 && (
        <div className="flex justify-center mb-4">
          <button
            onClick={fetchComments}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh comments
          </button>
        </div>
      )}

      {showInput && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Write a comment... (Use @ to mention users)"
                className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={loading}
                autoFocus
                ref={mentionInputRef}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                {newComment.length}/500
              </div>
              {renderMentionDropdown()}
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
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="mb-5">
                  <div className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-[2px] ring-2 ring-offset-2 ring-blue-100">
                          {comment.userProfilePicture ? (
                            <img
                              src={comment.userProfilePicture}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">
                              {comment.userName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 hover:text-gray-700">
                              {formatDate(comment.createdAt)}
                              {comment.updatedAt !== comment.createdAt && (
                                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  edited
                                </span>
                              )}
                            </span>
                          </div>

                          {editingComment === comment.id ? (
                            <div className="mt-2 relative">
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
                                className="w-full p-3 pr-12 border rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                autoFocus
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                                  Enter
                                </kbd>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-gray-700 leading-relaxed">
                              {renderCommentWithMentions(comment.content)}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-3">
                            <LikeButton
                              comment={comment}
                              onClick={handleReaction}
                            />

                            <button
                              onClick={() => {
                                toggleReplies(comment.id);
                                if (!showRepliesFor[comment.id]) {
                                  setReplyToComment(comment.id);
                                }
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              {showRepliesFor[comment.id] ? (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                  Hide replies
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                  {comment.replies.length > 0
                                    ? `View ${comment.replies.length} ${
                                        comment.replies.length === 1
                                          ? "reply"
                                          : "replies"
                                      }`
                                    : "Reply"}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.id === comment.userId && (
                          <button
                            onClick={() => setEditingComment(comment.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 transform hover:scale-110"
                            title="Edit comment"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        )}

                        {user.id === comment.userId && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className={`p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110 ${
                              deletingCommentId === comment.id
                                ? "animate-pulse"
                                : ""
                            }`}
                            title="Delete comment"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}

                        {user.id === postOwnerId &&
                          user.id !== comment.userId && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className={`p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                deletingCommentId === comment.id
                                  ? "animate-pulse"
                                  : ""
                              }`}
                              title="Delete comment as post owner"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}

                        {isAdmin &&
                          user.id !== comment.userId &&
                          user.id !== postOwnerId && (
                            <button
                              onClick={() => handleDelete(comment.id, true)}
                              disabled={deletingCommentId === comment.id}
                              className={`p-1.5 relative group/admin hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                deletingCommentId === comment.id
                                  ? "animate-pulse"
                                  : ""
                              }`}
                              title="Delete as Admin"
                            >
                              <svg
                                className="w-4 h-4 text-gray-500 group-hover/admin:text-red-600 transition-colors duration-200"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover/admin:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Admin Delete
                              </span>
                            </button>
                          )}
                      </div>
                    </div>

                    {renderReplies(comment)}

                    {replyToComment === comment.id &&
                      !showRepliesFor[comment.id] && (
                        <div className="pl-12 mt-3">
                          <form
                            className="flex items-center space-x-2"
                            onSubmit={(e) => handleReplySubmit(e, comment.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-blue-500">
                                  {user?.firstName?.charAt(0) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 relative">
                              <input
                                ref={replyInputRef}
                                type="text"
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                placeholder="Add a reply..."
                                className="w-full pl-3 pr-16 py-2 bg-gray-100 hover:bg-white focus:bg-white rounded-full text-sm border border-transparent focus:border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                              />
                              <button
                                type="submit"
                                disabled={
                                  submittingReply || !replyContent.trim()
                                }
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                              >
                                {submittingReply ? (
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                ) : (
                                  <svg
                                    className="h-5 w-5 transition-transform duration-200 transform rotate-90"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h4a1 1 0 00.894-1.447l-7-14z"></path>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Comments;
