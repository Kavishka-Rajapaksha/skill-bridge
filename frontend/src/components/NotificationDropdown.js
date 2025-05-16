import React from "react";
import { Link, useNavigate } from "react-router-dom";
import TimeAgo from "react-timeago";

const NotificationDropdown = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  unreadCount,
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    onMarkAsRead(notification.id);
    navigate(`/post/${notification.sourceId}`);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    onDeleteNotification(notificationId);
  };

  return (
    <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-1 rounded-md bg-white shadow-xs">
        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer group ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-grow">
                    <p className="text-sm text-gray-700">
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <TimeAgo
                        date={notification.createdAt}
                        className="text-xs text-gray-500"
                      />
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete notification"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
