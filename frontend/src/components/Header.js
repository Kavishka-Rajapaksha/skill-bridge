import React, { useContext } from 'react';
import { Link } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-xl font-bold text-blue-600">SkillBridge</Link>
        
        <nav className="flex items-center space-x-6">
          {/* Navigation links that are always visible */}
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          
          {/* Groups link for authenticated users */}
          {isAuthenticated && (
            <Link to="/groups" className="hover:text-blue-600 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Groups
            </Link>
          )}
          
          {/* Admin Dashboard link */}
          {isAuthenticated && user.role === "ROLE_ADMIN" && (
            <Link to="/admin/dashboard" className="hover:text-blue-600 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
          )}
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {/* User profile icon/avatar */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={`${user.name || user.email}'s profile`} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-medium">{(user.name || user.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-medium">{user.name || user.email}</span>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("userId");
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
