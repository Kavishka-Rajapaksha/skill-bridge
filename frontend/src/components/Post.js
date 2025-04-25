import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

function Post({ post, onPostDeleted, onPostUpdated }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Construct full URL for relative paths
  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.protocol}//${window.location.hostname}:8081${url}`;
  };

  // Fetch media as a blob and create object URL
  const getMediaUrl = async (mediaId, originalUrl) => {
    try {
      const response = await axiosInstance.get(`/api/media/${mediaId}`, {
        responseType: "blob",
      });
      if (response.data instanceof Blob) {
        return URL.createObjectURL(response.data);
      }
      console.warn(`Invalid blob for media ${mediaId}, using fallback URL`);
      return getFullUrl(originalUrl);
    } catch (error) {
      console.error(`Error loading media ${mediaId}:`, error);
      return getFullUrl(originalUrl); // Fallback to original URL
    }
  };

  // Load all media URLs
  useEffect(() => {
    const newMediaUrls = {};
    const loadMedia = async () => {
      // Handle video
      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        newMediaUrls.video = await getMediaUrl(mediaId, post.videoUrl);
      }

      // Handle images
      if (post.imageUrls?.length) {
        const imagePromises = post.imageUrls.map(async (url) => {
          const mediaId = url.split("/").pop();
          const mediaUrl = await getMediaUrl(mediaId, url);
          return { mediaId, mediaUrl };
        });
        const resolvedImages = await Promise.all(imagePromises);
        resolvedImages.forEach(({ mediaId, mediaUrl }) => {
          newMediaUrls[mediaId] = mediaUrl;
        });
      }

      setMediaUrls(newMediaUrls);
    };

    loadMedia();

    // Cleanup object URLs
    return () => {
      Object.values(newMediaUrls).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [post.videoUrl, post.imageUrls]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(`/api/posts/${post.id}?userId=${user.id}`);
      onPostDeleted?.(post.id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeleting(false);
    }
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

      // Clean up preview URLs
      editPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (error) {
      console.error("Error updating post:", error);
      alert(error.response?.data || "Failed to update post. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 p-6 transform transition duration-200 hover:shadow-lg">
      {user && user.id === post.userId && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            disabled={deleting || updating}
          >
            <svg
              className="w-5 h-5 text-gray-600 hover:text-gray-800"
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 first:rounded-t-md"
              >
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Post
                </span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`w-full text-left px-4 py-3 text-sm ${
                  deleting
                    ? "text-gray-400"
                    : "text-red-600 hover:bg-red-50 hover:text-red-700"
                } transition-colors duration-150 last:rounded-b-md`}
              >
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {deleting ? "Deleting..." : "Delete Post"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4 overflow-hidden">
          {post.userProfilePicture ? (
            <img
              src={post.userProfilePicture}
              alt={post.userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-white">
              {post.userName?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {post.userName || "Unknown User"}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateSubmit} className="mt-4">
          <textarea
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={updating}
          />
          {editPreviewUrls.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {editPreviewUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
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
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              Add Images
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  updating || (!editContent.trim() && editImages.length === 0)
                }
                className={`px-4 py-2 rounded text-white ${
                  updating || (!editContent.trim() && editImages.length === 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {updating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <p className="mb-6 text-gray-800 whitespace-pre-wrap">
            {post.content}
          </p>

          {post.videoUrl && (
            <div className="mb-6 rounded-lg overflow-hidden bg-black">
              <video
                src={mediaUrls.video || getFullUrl(post.videoUrl)}
                className="w-full max-h-[600px] object-contain"
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
              className={`mb-6 grid gap-4 ${
                post.imageUrls.length === 1
                  ? "grid-cols-1"
                  : post.imageUrls.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {post.imageUrls.map((url, index) => {
                const mediaId = url.split("/").pop();
                return (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={mediaUrls[mediaId] || getFullUrl(url)}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.error("Image failed to load:", url);
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEZhaWxlZCB0byBMb2FkPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
                <svg
                  className="w-6 h-6"
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
                <span className="font-medium">
                  {post.comments?.length || 0}
                </span>
              </button>
            </div>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors duration-200">
              <svg
                className="w-6 h-6"
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
              <span className="font-medium">Share</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Post;
