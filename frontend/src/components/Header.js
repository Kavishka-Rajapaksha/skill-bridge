import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../utils/axios";
import NotificationDropdown from "./NotificationDropdown";
import WebSocketService from "../services/WebSocketService";
import UserSearchService from "../utils/userSearchService";
import SearchResultItem from "./SearchResultItem";
import debounce from "lodash/debounce";

function Header() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [showGroupsDropdown, setShowGroupsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownGroupsRef = useRef(null);
  const dropdownProfileRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownNotificationsRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const navigate = useNavigate();

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length >= 2) {
        setIsSearching(true);
        setSearchResults([]); // Clear old results while searching

        try {
          console.log("Initiating search for:", query);
          const results = await UserSearchService.searchUsers(query);
          console.log("Search results received:", results);

          if (Array.isArray(results) && results.length > 0) {
            setSearchResults(results);
          } else {
            // If no results but we have a valid query, try direct fetch
            console.log("No results, trying direct search");
            const directResults = await axiosInstance.get(
              `/api/users?search=${encodeURIComponent(query)}`
            );
            if (
              Array.isArray(directResults.data) &&
              directResults.data.length > 0
            ) {
              setSearchResults(directResults.data);
            } else {
              setSearchResults([]);
            }
          }
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(true);
    if (value.length >= 2) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user) => {
    setShowSearchResults(false);
    setSearchTerm("");
    navigate(`/profile/${user.id}`);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownGroupsRef.current &&
        !dropdownGroupsRef.current.contains(event.target)
      ) {
        setShowGroupsDropdown(false);
      }
      if (
        dropdownProfileRef.current &&
        !dropdownProfileRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        dropdownNotificationsRef.current &&
        !dropdownNotificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowSearchResults(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.get(
        `/api/notifications?userId=${user.id}`
      );
      if (response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put(
        `/api/notifications/mark-all-read?userId=${user.id}`
      );
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = useCallback(
    debounce(async (notificationId) => {
      try {
        await axiosInstance.delete(`/api/notifications/${notificationId}`);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Also update unread count if the deleted notification was unread
        const wasUnread = notifications.find(
          (n) => n.id === notificationId && !n.read
        );
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        if (!axiosInstance.isCancel(error)) {
          console.error("Error deleting notification:", error);
          // Error message is logged to console instead of showing a popup
        }
      }
    }, 300),
    [notifications]
  ); // 300ms debounce

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const isAdmin = isAuthenticated && user && user.role === "ROLE_ADMIN";

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      WebSocketService.connect(user.id);
      WebSocketService.setNotificationCallback((newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if (Notification.permission === "granted") {
          new Notification("SkillBridge", {
            body: newNotification.content,
            icon: "/favicon.ico",
          });
        }
      });

      if (Notification.permission === "default") {
        Notification.requestPermission();
      }

      return () => WebSocketService.disconnect();
    }
  }, [isAuthenticated, user]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold"
          >
            <div className="h-9 w-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <span className="font-bold">SB</span>
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              SkillBridge
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:block flex-1 max-w-md mx-4 relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchTerm.length >= 2) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-gray-400 hover:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
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

              {showSearchResults && (
                <div
                  ref={searchResultsRef}
                  className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg max-h-80 overflow-y-auto border border-gray-200"
                >
                  {isSearching ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((user) => (
                        <SearchResultItem
                          key={user.id}
                          user={user}
                          onSelect={handleSelectUser}
                        />
                      ))}
                    </div>
                  ) : searchTerm.length >= 2 ? (
                    <div className="py-4 px-4 text-center text-gray-500">
                      <p>No users found matching "{searchTerm}"</p>
                      <button
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        onClick={() => debouncedSearch(searchTerm)}
                      >
                        Try search again
                      </button>
                    </div>
                  ) : searchTerm.length > 0 ? (
                    <div className="py-4 px-4 text-center text-gray-500">
                      Enter at least 2 characters to search
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="md:hidden flex items-center">
            {isAuthenticated && (
              <button
                onClick={() => {
                  searchInputRef.current?.focus();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none mr-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-md hover:bg-blue-50 font-medium"
            >
              <svg
                className="h-5 w-5 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </Link>

            {isAuthenticated && (
              <div className="relative" ref={dropdownNotificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-md hover:bg-blue-50 font-medium relative"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  <svg
                    className={`h-6 w-6 ${
                      unreadCount > 0 ? "text-blue-600" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDeleteNotification={handleDeleteNotification}
                    onClose={() => setShowNotifications(false)}
                    unreadCount={unreadCount}
                  />
                )}
              </div>
            )}

            {isAuthenticated && (
              <div className="relative" ref={dropdownGroupsRef}>
                <button
                  onClick={() => setShowGroupsDropdown(!showGroupsDropdown)}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-md hover:bg-blue-50 font-medium"
                >
                  <svg
                    className="h-5 w-5 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Groups
                  <svg
                    className={`ml-1.5 h-4 w-4 transition-transform duration-200 ${
                      showGroupsDropdown ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showGroupsDropdown && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transform transition-all duration-200">
                    <div className="py-1 rounded-md bg-white shadow-xs">
                      <Link
                        to="/groups"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setShowGroupsDropdown(false)}
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        All Groups
                      </Link>
                      <Link
                        to="/groups/my-groups"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setShowGroupsDropdown(false)}
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        My Groups
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        to="/groups/create"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setShowGroupsDropdown(false)}
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create Group
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-md hover:bg-blue-50 font-medium"
              >
                <svg
                  className="h-5 w-5 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Admin Panel
                {isAdmin && (
                  <span className="ml-2 bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownProfileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-all duration-200 p-1 rounded-lg focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-0.5 shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={`${user.firstName || user.email}'s profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-indigo-600">
                            {(user.firstName || user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">
                        {user.firstName
                          ? `${user.firstName} ${user.lastName || ""}`
                          : user.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {isAdmin ? "Administrator" : "Member"}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showProfileDropdown ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transform transition-all duration-200">
                    <div className="py-1 rounded-md bg-white shadow-xs">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <svg
                            className="h-4 w-4 mr-2 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-150"
                      >
                        <svg
                          className="h-4 w-4 mr-2 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-sm hover:shadow transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {isAuthenticated && mobileMenuOpen && (
          <div className="pt-2 pb-3 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchTerm.length >= 2) {
                    setShowSearchResults(true);
                  }
                }}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => {
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                >
                  <svg
                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
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
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute z-50 left-4 right-4 mt-1 bg-white rounded-md shadow-lg max-h-80 overflow-y-auto border border-gray-200"
              >
                {isSearching ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((user) => (
                      <SearchResultItem
                        key={user.id}
                        user={user}
                        onSelect={(user) => {
                          handleSelectUser(user);
                          setMobileMenuOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ) : searchTerm.length >= 2 ? (
                  <div className="py-4 px-4 text-center text-gray-500">
                    No users found matching "{searchTerm}"
                  </div>
                ) : searchTerm.length > 0 ? (
                  <div className="py-4 px-4 text-center text-gray-500">
                    Enter at least 2 characters to search
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } md:hidden transition-all duration-300 ease-in-out`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1">
            {isAuthenticated && (
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-700">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      to={`/post/${notification.sourceId}`}
                      className={`block px-2 py-2 text-sm ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {notification.content}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              to="/"
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/groups"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  All Groups
                </Link>
                <Link
                  to="/groups/my-groups"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Groups
                </Link>
                <Link
                  to="/groups/create"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Group
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
