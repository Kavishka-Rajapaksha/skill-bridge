import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import AdminApiService from "../utils/apiService";

function ShareToGroupModal({ isOpen, onClose, postId, onSuccess, post }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axiosInstance.get("/api/groups");
        setGroups(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const handleShare = async () => {
    if (!selectedGroup) {
      setError("Please select a group");
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      setError("Please log in to share posts");
      return;
    }

    try {
      setIsSharing(true);
      await AdminApiService.sharePost(postId, selectedGroup);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share post");
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-black opacity-30"></div>
        <div className="relative bg-white rounded-lg w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Share Post to Group</h2>

          {/* User Details */}
          {post && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              {/* Original Post Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {post.originalUserProfilePicture ||
                    post.userProfilePicture ? (
                      <img
                        src={
                          post.originalUserProfilePicture ||
                          post.userProfilePicture
                        }
                        alt={post.originalUserName || post.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-sm font-semibold text-indigo-600">
                        {(post.originalUserName || post.userName || "U").charAt(
                          0
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {post.originalUserName || post.userName}
                  </p>
                  <p className="text-sm text-gray-500">Original author</p>
                </div>
              </div>

              {/* Currently sharing user (logged in user) */}
              <div className="flex items-center gap-3 pl-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {JSON.parse(localStorage.getItem("user"))
                      ?.profilePicture ? (
                      <img
                        src={
                          JSON.parse(localStorage.getItem("user"))
                            .profilePicture
                        }
                        alt="Your profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-xs font-semibold text-indigo-600">
                        {JSON.parse(
                          localStorage.getItem("user")
                        )?.firstName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {`${
                      JSON.parse(localStorage.getItem("user"))?.firstName || ""
                    } ${
                      JSON.parse(localStorage.getItem("user"))?.lastName || ""
                    }`.trim() || "You"}
                  </p>
                  <p className="text-sm text-gray-500">Sharing this post</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a group to share with
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="">Choose a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing || !selectedGroup}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors duration-200"
                >
                  {isSharing ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sharing...
                    </span>
                  ) : (
                    "Share Post"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ShareToGroupModal;
