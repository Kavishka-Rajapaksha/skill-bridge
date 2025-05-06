import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Header() {
  const { user: contextUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  // Ensure we have user info by checking both context and localStorage
  useEffect(() => {
    const checkUserAuth = () => {
      if (contextUser) {
        console.log("User from context:", contextUser);
        setUser(contextUser);
      } else {
        try {
          const storedUserStr = localStorage.getItem("user");
          if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            console.log("User from localStorage:", storedUser);
            setUser(storedUser);
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          localStorage.removeItem("user"); // Remove invalid data
        }
      }
    };

    checkUserAuth();
    // Add event listener for storage changes
    window.addEventListener('storage', checkUserAuth);
    
    return () => {
      window.removeEventListener('storage', checkUserAuth);
    };
  }, [contextUser]);

  // For debugging - log whenever user state changes
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  // Helper function to get display name
  const getUserDisplayName = () => {
    if (!user) return "User";
    
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    
    return "User";
  };

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
                  <path d="M7 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm7 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm7 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
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
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                      alt={`${getUserDisplayName()}'s profile`} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium">{getUserDisplayName().charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-medium">{getUserDisplayName()}</span>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("userId");
                  setUser(null);
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
