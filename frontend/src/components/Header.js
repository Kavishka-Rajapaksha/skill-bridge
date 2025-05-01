import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Header() {
  const { user: contextUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  // Ensure we have user info by checking both context and localStorage
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }
  }, [contextUser]);

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-xl font-bold text-blue-600">SkillBridge</Link>
        
        <nav className="flex items-center space-x-6">
          {/* Navigation links that are always visible */}
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          
          {/* Only show additional navigation if user is logged in */}
          {user && (
            <>
              {/* Group icon */}
              <Link 
                to="/groups" 
                className="hover:text-blue-600 transition-colors flex items-center space-x-1"
                title="Groups"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zm6 5a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4zm2.068 1.307a6.965 6.965 0 00-3.015-.788 7.01 7.01 0 00-5.051 1.882c-.896.88-.896 2.13 0 3.015a7.142 7.142 0 005.051 1.884c1.289-.02 2.47-.447 3.429-1.094a.75.75 0 10-.793-1.275 5.253 5.253 0 01-2.636.814 5.53 5.53 0 01-3.994-1.422.25.25 0 010-.375c.897-.89 2.458-1.434 3.994-1.422a5.253 5.253 0 012.636.814.75.75 0 10.793-1.275 6.787 6.787 0 00-.414-.207zm1.197-3.43a6.933 6.933 0 013.948 1.215.75.75 0 10.793-1.275 8.445 8.445 0 00-8.011-.607.75.75 0 00.415 1.436 6.944 6.944 0 012.855-.769z" />
                </svg>
                <span>Groups</span>
              </Link>

              {/* Admin Dashboard link - only show for admins */}
              {user.role === "ROLE_ADMIN" && (
                <Link 
                  to="/admin/dashboard" 
                  className="hover:text-blue-600 transition-colors flex items-center space-x-1"
                  title="Admin Dashboard"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              )}
            </>
          )}
          
          {/* Authentication links */}
          {user ? (
            <div className="flex items-center space-x-4">
              {/* User profile icon/avatar */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={`${user.firstName}'s profile`} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium">{(user.firstName || user.name || "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-medium">{user.firstName || user.name || "User"}</span>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
