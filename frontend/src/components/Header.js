import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="bg-white shadow-md py-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text cursor-pointer" 
             onClick={() => navigate("/")}>
          SkillBridge
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Icons for logged in users */}
              <button 
                className="p-2 rounded-full hover:bg-gray-100" 
                title="Home"
                onClick={() => navigate("/")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              
              <button className="p-2 rounded-full hover:bg-gray-100" title="Messages">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              
              <button className="p-2 rounded-full hover:bg-gray-100" title="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {/* Profile dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 relative"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.firstName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold">
                        {user.firstName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium hidden sm:block">{user.firstName}</span>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b">
                      <div className="font-semibold">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    
                    <div className="py-1">
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate(`/profile/${user.id}`);
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate("/edit-profile");
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login and Register buttons for non-logged in users */}
              <button 
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition duration-200"
              >
                Login
              </button>
              <button 
                onClick={() => navigate("/register")}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:opacity-90 transition duration-200"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
