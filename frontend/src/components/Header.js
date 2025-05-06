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
