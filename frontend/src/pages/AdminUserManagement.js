import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Header from "../components/Header";

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, userId: null, currentStatus: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, userId: null });
  const [editDialog, setEditDialog] = useState({ isOpen: false, userData: null });
  const [roleDialog, setRoleDialog] = useState({ isOpen: false, userId: null, currentRole: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userData);
        if (user.role !== "ROLE_ADMIN") {
          navigate("/");
          return;
        }
        
        setUser(user);
        fetchUsers();
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      // Try to fetch real data
      const response = await axiosInstance.get("/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Using sample data instead.");
      
      // Use sample data as fallback
      setUsers([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'ROLE_USER', enabled: true },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'ROLE_USER', enabled: true },
        { id: '3', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ROLE_ADMIN', enabled: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axiosInstance.put(`/api/admin/users/${userId}/toggle-status`);
      setUsers(users.map(user => 
        user.id === userId ? {...user, enabled: !currentStatus} : user
      ));
    } catch (error) {
      console.error("Error toggling user status:", error);
      setError("Failed to update user status. Please try again.");
    }
  };

  const openStatusConfirmation = (userId, currentStatus) => {
    setConfirmDialog({
      isOpen: true,
      userId,
      currentStatus,
    });
  };

  const handleConfirmStatusChange = () => {
    handleToggleUserStatus(confirmDialog.userId, confirmDialog.currentStatus);
    setConfirmDialog({ isOpen: false, userId: null, currentStatus: false });
  };

  const handlePromoteToAdmin = async (userId) => {
    try {
      await axiosInstance.put(`/api/admin/users/${userId}/promote`);
      setUsers(users.map(user => 
        user.id === userId ? {...user, role: 'ROLE_ADMIN'} : user
      ));
    } catch (error) {
      console.error("Error promoting user:", error);
      setError("Failed to promote user. Please try again.");
    }
  };

  const openRoleConfirmation = (userId, currentRole) => {
    if (currentRole === "ROLE_ADMIN") return; // Don't allow changing admin roles
    setRoleDialog({
      isOpen: true,
      userId,
      currentRole,
    });
  };

  const handleConfirmRoleChange = () => {
    handlePromoteToAdmin(roleDialog.userId);
    setRoleDialog({ isOpen: false, userId: null, currentRole: "" });
  };

  const openDeleteConfirmation = (userId) => {
    setDeleteDialog({
      isOpen: true,
      userId,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosInstance.delete(`/api/admin/users/${deleteDialog.userId}`);
      setUsers(users.filter(user => user.id !== deleteDialog.userId));
      setDeleteDialog({ isOpen: false, userId: null });
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
      setDeleteDialog({ isOpen: false, userId: null });
    }
  };

  const openEditDialog = (userData) => {
    setEditDialog({
      isOpen: true,
      userData: { ...userData },
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axiosInstance.put(`/api/admin/users/${editDialog.userData.id}`, editDialog.userData);
      
      setUsers(users.map(user => 
        user.id === editDialog.userData.id ? response.data : user
      ));
      
      setEditDialog({ isOpen: false, userData: null });
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user. Please try again.");
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditDialog({
      ...editDialog,
      userData: {
        ...editDialog.userData,
        [name]: value,
      }
    });
  };

  if (loading) {
    return (
      <>
        <Header user={user} />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} />
      <div className="flex">
        {/* Sidebar - Same as in AdminDashboard */}
        <div className={`bg-gray-800 text-white w-64 min-h-screen flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Admin Panel</h2>
              <button 
                className="md:hidden text-white focus:outline-none" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <nav className="mt-4">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Main</p>
              <Link 
                to="/admin/dashboard" 
                className="mt-2 flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </div>
            
            <div className="mt-4 px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">User Management</p>
              <div className="mt-2 space-y-1">
                <Link 
                  to="/admin/users/add" 
                  className="flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User
                </Link>
                
                <Link 
                  to="/admin/users" 
                  className="flex items-center px-4 py-2 text-sm rounded-md bg-gray-700 text-white hover:bg-gray-600"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Users
                </Link>
                
                <Link 
                  to="/admin/users/blocked" 
                  className="flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Blocked Users
                </Link>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Content</p>
              <div className="mt-2 space-y-1">
                <Link 
                  to="/admin/posts" 
                  className="flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Manage Posts
                </Link>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Settings</p>
              <Link 
                to="/admin/settings" 
                className="mt-2 flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Settings
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Mobile sidebar toggle */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                <Link 
                  to="/admin/users/add" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add New User
                </Link>
              </div>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                                {user.firstName?.[0] || "U"}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openRoleConfirmation(user.id, user.role)}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "ROLE_ADMIN" 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-blue-100 text-blue-800 cursor-pointer hover:opacity-80"
                            }`}>
                            {user.role === "ROLE_ADMIN" ? "Admin" : "User"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => openStatusConfirmation(user.id, user.enabled)}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                              user.enabled 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                            {user.enabled ? "Active" : "Blocked"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button 
                            onClick={() => openEditDialog(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteConfirmation(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Change User Status</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {confirmDialog.currentStatus 
                    ? "Do you want to block this user?" 
                    : "Do you want to activate this user?"}
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-4">
                <button
                  id="cancel-btn"
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none"
                  onClick={() => setConfirmDialog({ isOpen: false, userId: null, currentStatus: false })}
                >
                  Cancel
                </button>
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                  onClick={handleConfirmStatusChange}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Dialog */}
      {roleDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Promote User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Do you want to promote this user to Admin?
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-4">
                <button
                  id="cancel-btn"
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none"
                  onClick={() => setRoleDialog({ isOpen: false, userId: null, currentRole: "" })}
                >
                  Cancel
                </button>
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                  onClick={handleConfirmRoleChange}
                >
                  Yes, Promote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-4">
                <button
                  id="cancel-btn"
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none"
                  onClick={() => setDeleteDialog({ isOpen: false, userId: null })}
                >
                  Cancel
                </button>
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none"
                  onClick={handleConfirmDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editDialog.isOpen && editDialog.userData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setEditDialog({ isOpen: false, userData: null })}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={editDialog.userData.firstName || ""}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={editDialog.userData.lastName || ""}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={editDialog.userData.email || ""}
                    onChange={handleEditInputChange}
                    required
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1"
                  onClick={() => setEditDialog({ isOpen: false, userData: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:col-start-2"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminUserManagement;
