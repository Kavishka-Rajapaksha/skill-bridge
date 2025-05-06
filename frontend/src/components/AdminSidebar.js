import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
      </div>
      <nav className="mt-4">
        <ul>
          <li className="mb-1">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                isActive
                  ? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                  : "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              }
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              Dashboard
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive
                  ? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                  : "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              }
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              Users
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/admin/users/blocked"
              className={({ isActive }) =>
                isActive
                  ? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                  : "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              }
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              Blocked Users
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/admin/users/add"
              className={({ isActive }) =>
                isActive
                  ? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                  : "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              }
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              Add User
            </NavLink>
          </li>
          <li className="mb-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                  : "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              }
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              </span>
              Back to Site
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
