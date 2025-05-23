import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import axiosInstance from "../utils/axios";
import Comments from "./Comments";
import ReactionButton from "./ReactionButton";
import ReportModal from "./ReportModal";
import WebSocketService from "../services/WebSocketService";
import { AuthContext } from "../context/AuthContext";
import { usePopup } from "../context/PopupContext";
import ShareToGroupModal from "./ShareToGroupModal";

function Post({ post, onPostDeleted, onPostUpdated }) {
  const { isAuthenticated } = useContext(AuthContext);
  const { showConfirmation, showPopup } = usePopup();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const [mediaErrors, setMediaErrors] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [showReportModal, setShowReportModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const refreshTimeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const [quietUpdate, setQuietUpdate] = useState(false);
  const previousPostRef = useRef(post);
  const userActivityTimeoutRef = useRef(null);
  const isUserActiveRef = useRef(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    console.log("Post object:", post);
    if (user && user.role === "ROLE_ADMIN") {
      setIsUserAdmin(true);
    }
  }, [user, post]);

  useEffect(() => {
    const handleUserActivity = () => {
      isUserActiveRef.current = true;

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      clearTimeout(userActivityTimeoutRef.current);
      userActivityTimeoutRef.current = setTimeout(() => {
        isUserActiveRef.current = false;

        if (!showComments && !isRefreshingRef.current) {
          refreshTimeoutRef.current = setTimeout(() => {
            refreshPostData(true);
          }, 500);
        }
      }, 3000);
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("touchmove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("touchmove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);

      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [showComments]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.protocol}//${window.location.hostname}:8081${url}`;
  };

  const FALLBACK_IMAGE_URL = encodeURI(
    "data:image/svg+xml;base64," +
      btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle" dy=".3em">
        Image Not Found
      </text>
    </svg>
  `)
  );

  const getMediaUrl = async (mediaId, originalUrl) => {
    if (!mediaId) return getFullUrl(originalUrl);

    try {
      const response = await axiosInstance.getMedia(mediaId);
      if (response.data && typeof response.data === "string") {
        return response.data;
      }
      console.warn(`Invalid media data for ${mediaId}, using fallback URL`);
      return getFullUrl(originalUrl);
    } catch (error) {
      console.error(`Error loading media ${mediaId}:`, error);
      setMediaErrors((prev) => ({ ...prev, [mediaId]: true }));
      return FALLBACK_IMAGE_URL;
    }
  };

  useEffect(() => {
    const loadMedia = async () => {
      const newMediaUrls = {};

      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        try {
          newMediaUrls.video = await getMediaUrl(mediaId, post.videoUrl);
        } catch (error) {
          console.error("Failed to load video:", error);
        }
      }

      if (post.imageUrls?.length) {
        for (const url of post.imageUrls) {
          const mediaId = url.split("/").pop();
          try {
            const mediaUrl = await getMediaUrl(mediaId, url);
            newMediaUrls[mediaId] = mediaUrl;
          } catch (error) {
            console.error("Failed to load image:", error);
          }
        }
      }

      setMediaUrls(newMediaUrls);
    };

    loadMedia();

    return () => {
      Object.values(mediaUrls).forEach((url) => {
        if (url && typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [post.videoUrl, post.imageUrls]);

  const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const refreshPostData = useCallback(
    async (quiet = false) => {
      if (isRefreshingRef.current) return;

      try {
        isRefreshingRef.current = true;
        setQuietUpdate(quiet);

        const response = await axiosInstance.get(`/api/posts/${post.id}`);
        if (response.data) {
          setCommentCount(response.data.comments?.length || 0);

          const hasSignificantChanges =
            previousPostRef.current.content !== response.data.content ||
            previousPostRef.current.reactions?.length !==
              response.data.reactions?.length;

          if (hasSignificantChanges) {
            onPostUpdated?.(response.data);
            previousPostRef.current = response.data;
          }

          setLastRefreshed(Date.now());
        }
      } catch (error) {
        console.error("Error refreshing post data:", error);
      } finally {
        isRefreshingRef.current = false;
        setTimeout(() => setQuietUpdate(false), 7000);
      }
    },
    [post.id, onPostUpdated]
  );

  const debouncedRefresh = useCallback(
    debounce((quiet) => refreshPostData(quiet), 7000),
    [refreshPostData]
  );

  const handleReactionChange = ({ liked, count }) => {
    const updatedPost = {
      ...post,
      userReaction: liked ? { type: "LIKE" } : null,
      reactionCount: count,
    };

    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  };

  useEffect(() => {
    previousPostRef.current = post;
  }, [post]);

  useEffect(() => {
    if (!showComments) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        refreshPostData(true);
      }, 60000);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [showComments, refreshPostData, lastRefreshed]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      let wsSubscription = null;

      const setupWebSocketConnection = async () => {
        try {
          await WebSocketService.waitForConnection(3000);

          wsSubscription = WebSocketService.subscribeToPostUpdates(
            post.id,
            (update) => {
              if (update.type === "REACTION" || update.type === "COMMENT") {
                if (update.type === "COMMENT") {
                  if (update.action === "ADD") {
                    setCommentCount((prev) => prev + 1);
                  } else if (update.action === "DELETE") {
                    setCommentCount((prev) => Math.max(0, prev - 1));
                  }
                } else {
                  setTimeout(() => debouncedRefresh(true), 300);
                }
              }
            }
          );

          const response = await axiosInstance.getCommentCount(post.id);
          setCommentCount(response.data.count);
        } catch (error) {
          console.warn(`Failed to setup WebSocket for post ${post.id}:`, error);
        }
      };

      setupWebSocketConnection();

      return () => {
        if (wsSubscription) wsSubscription();
      };
    }
  }, [isAuthenticated, user, post.id, debouncedRefresh]);

  const handleDelete = async () => {
    showConfirmation({
      title: "Delete Post",
      message: "Are you sure you want to delete this post?",
      onConfirm: async () => {
        try {
          setDeleting(true);
          const endpoint = `/api/posts/${post.id}`;
          const params = new URLSearchParams({
            userId: user.id,
            isAdmin: isUserAdmin && user.id !== post.userId,
          });

          await axiosInstance.delete(`${endpoint}?${params}`);

          onPostDeleted?.(post.id);
          setShowMenu(false);

          showPopup({
            message: "Post deleted successfully!",
            type: "success",
            duration: 4000,
            icon: (
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ),
            animation: "slide-up",
          });
        } catch (error) {
          console.error("Error deleting post:", error);
          const errorMessage =
            error.response?.data || "Failed to delete post. Please try again.";

          showPopup({
            message: errorMessage,
            type: "error",
            duration: 4000,
            icon: (
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          });
        } finally {
          setDeleting(false);
        }
      },
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    setShowMenu(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setEditContent(post.content);
    setEditImages([]);
    setEditPreviewUrls([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setEditImages(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setEditPreviewUrls(urls);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim() && editImages.length === 0) return;

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("content", editContent);
      editImages.forEach((image) => formData.append("images", image));

      const response = await axiosInstance.put(
        `/api/posts/${post.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onPostUpdated?.(response.data);
      setIsEditing(false);

      editPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (error) {
      console.error("Error updating post:", error);
      alert(error.response?.data || "Failed to update post. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCommentClick = () => {
    const newShowState = !showComments;
    setShowComments(newShowState);

    if (newShowState) {
      setShowCommentInput(true);
      refreshPostData();
    }
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
    if (onPostUpdated) {
      onPostUpdated({ ...post, comments: new Array(newCount) });
    }
  };

  const handleReportSuccess = () => {
    console.log("Report submitted successfully");
  };

  const handleShareSuccess = () => {
    showPopup({
      message: "Post shared successfully!",
      type: "success",
      duration: 3000,
    });
    refreshPostData(); // Refresh the post to reflect the updated shared details
  };

  const formatContent = (content) => {
    if (!content) return "";

    const formattedContent = content
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre"><code>$1</code></pre>'
      )
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");

    return formattedContent;
  };

  const commentsKey = `comments-${post.id}-${showComments}`;

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 mb-6 overflow-hidden border border-gray-100 ${
        quietUpdate ? "transition-none" : ""
      }`}
    >
      {(post.sharedByUserId || post.sharedByUserName) && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          {/* Shared by section */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                {post.sharedByUserProfilePicture ? (
                  <img
                    src={post.sharedByUserProfilePicture}
                    alt={post.sharedByUserName || "Shared by"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE_URL;
                    }}
                  />
                ) : (
                  <span className="text-lg font-semibold text-indigo-600">
                    {(post.sharedByUserName || "U").charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {post.sharedByUserName || "Unknown User"}
              </p>
              <p className="text-sm text-gray-500">
                shared a post •{" "}
                {formatDate(post.sharedAt || post.createdAt) || "N/A"}
              </p>
            </div>
          </div>

          {/* Original post wrapper */}
          <div className="ml-12 mt-2 border-l-2 border-gray-200 pl-4">
            {/* Original post header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                  {post.originalUserProfilePicture ? (
                    <img
                      src={post.originalUserProfilePicture}
                      alt={post.originalUserName || "Original poster"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE_URL;
                      }}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-indigo-600">
                      {(post.originalUserName || "U").charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {post.originalUserName || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(post.originalCreatedAt || post.createdAt) ||
                    "N/A"}
                </p>
              </div>
            </div>

            {/* Original post content */}
            <div className="mt-3">
              {/* Use original content if available, fallback to current content */}
              <p className="text-gray-800 whitespace-pre-wrap">
                {post.originalContent || post.content}
              </p>

              {/* Original media */}
              <div className="mt-3 space-y-2">
                {(post.originalVideoUrl || post.videoUrl) && (
                  <video
                    src={getFullUrl(post.originalVideoUrl || post.videoUrl)}
                    className="w-full rounded-lg"
                    controls
                  />
                )}

                {(post.originalImageUrls?.length > 0 ||
                  post.imageUrls?.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {(post.originalImageUrls || post.imageUrls || []).map(
                      (url, index) => (
                        <img
                          key={index}
                          src={getFullUrl(url)}
                          alt={`Original post image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE_URL;
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only render regular post header and content if not a shared post */}
      {!post.sharedByUserId && !post.sharedFrom && (
        <>
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                  {post.userProfilePicture ? (
                    <img
                      src={post.userProfilePicture}
                      alt={post.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-indigo-600">
                      {post.userName?.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {post.userName || "Unknown User"}
                </h3>
                <p className="text-xs text-gray-500 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  disabled={deleting || updating}
                >
                  <svg
                    className={`w-5 h-5 ${
                      deleting || updating ? "text-gray-300" : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100 origin-top-right">
                    {user.id === post.userId && (
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Post
                      </button>
                    )}
                    {user.id === post.userId || isUserAdmin ? (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center ${
                          deleting
                            ? "text-gray-400 bg-gray-50"
                            : "text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 mr-3 ${
                            deleting ? "text-gray-400" : "text-red-500"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {deleting
                          ? "Deleting..."
                          : isUserAdmin && user.id !== post.userId
                          ? "Delete as Admin"
                          : "Delete Post"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Report Post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            {isEditing ? (
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-700 min-h-[120px]"
                    rows="3"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={updating}
                    placeholder="What's on your mind?"
                  />
                </div>

                {editPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {editPreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden shadow-sm border border-gray-200"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          className="h-24 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="edit-image-input"
                    disabled={updating}
                  />
                  <label
                    htmlFor="edit-image-input"
                    className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Add Images
                  </label>

                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                      disabled={updating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        updating ||
                        (!editContent.trim() && editImages.length === 0)
                      }
                      className={`px-6 py-2 rounded-md text-white font-medium shadow-sm transition-all duration-200 ${
                        updating ||
                        (!editContent.trim() && editImages.length === 0)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow"
                      }`}
                    >
                      {updating ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Updating...
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div
                  className="text-gray-800 mb-4 leading-relaxed px-5"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(post.content)
                      .split("\n")
                      .join("<br />"),
                  }}
                />

                <div className="space-y-4 mt-3">
                  {post.videoUrl && (
                    <div className="rounded-lg overflow-hidden shadow-sm">
                      <video
                        src={mediaUrls.video || getFullUrl(post.videoUrl)}
                        className="max-h-[500px] w-full object-contain bg-black"
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                          console.error("Video loading error:", e);
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlZpZGVvIEZhaWxlZCB0byBMb2FkPC90ZXh0Pjwvc3ZnPg==";
                        }}
                      />
                    </div>
                  )}

                  {post.imageUrls?.length > 0 && (
                    <div
                      className={`grid ${
                        post.imageUrls.length === 1
                          ? "grid-cols-1"
                          : "grid-cols-2"
                      } gap-2 px-5`}
                    >
                      {post.imageUrls.map((url, index) => {
                        const mediaId = url.split("/").pop();
                        return (
                          <div
                            key={index}
                            className={`rounded-lg overflow-hidden shadow-sm border border-gray-100 ${
                              post.imageUrls.length === 1 ? "col-span-1" : ""
                            } ${
                              post.imageUrls.length === 3 && index === 0
                                ? "col-span-2"
                                : ""
                            }`}
                          >
                            <img
                              src={mediaUrls[mediaId] || getFullUrl(url)}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover max-h-[500px]"
                              onError={(e) => {
                                console.error("Image failed to load:", url);
                                e.target.src = FALLBACK_IMAGE_URL;
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="relative">
            <ReactionButton
              postId={post.id}
              userId={user.id}
              onReactionChange={handleReactionChange}
              key={`reaction-${lastRefreshed}`}
              renderButton={({ liked, count, onClick, loading }) => (
                <button
                  onClick={onClick}
                  disabled={loading}
                  className={`group flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    liked
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <svg
                      className={`w-6 h-6 transition-transform duration-300 ${
                        liked
                          ? "text-red-500 scale-110"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={liked ? "0" : "2"}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>

                    {liked && (
                      <span className="heart-animation absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-red-500 absolute animate-ping opacity-75"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-medium ${
                      liked ? "text-red-500" : "text-gray-700"
                    } transition-colors duration-300`}
                  >
                    {loading ? (
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
                    ) : count > 0 ? (
                      `${count} ${count === 1 ? "Like" : "Likes"}`
                    ) : (
                      "Like"
                    )}
                  </span>
                </button>
              )}
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleCommentClick}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors duration-200 ${
                showComments
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${commentCount > 0 ? "text-blue-500" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-medium">{commentCount}</span>
            </button>

            {user.id !== post.userId && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>Report</span>
              </button>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
          <Comments
            postId={post.id}
            postOwnerId={post.userId}
            showInput={showCommentInput}
            onCommentCountChange={handleCommentCountChange}
            key={commentsKey}
          />
        </div>
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post.id}
        onSuccess={handleReportSuccess}
      />

      <ShareToGroupModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        onSuccess={handleShareSuccess}
        post={post}
      />
    </div>
  );
}

export default Post;
