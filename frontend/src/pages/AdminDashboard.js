import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import Header from "../components/Header";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    newUsersToday: 0,
    activeUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        await fetchDashboardData();
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      // In a real application, you'd make API calls to get this data
      // For now, we'll simulate with some placeholder requests
      
      const [usersRes, postsRes, recentUsersRes, recentPostsRes] = await Promise.all([
        axiosInstance.get("/api/admin/stats/users"),
        axiosInstance.get("/api/admin/stats/posts"),
        axiosInstance.get("/api/admin/users/recent"),
        axiosInstance.get("/api/admin/posts/recent")
      ]);

      setStats({
        totalUsers: usersRes.data.total,
        totalPosts: postsRes.data.total,
        newUsersToday: usersRes.data.newToday,
        activeUsers: usersRes.data.active
      });
      
      setRecentUsers(recentUsersRes.data);
      setRecentPosts(recentPostsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use placeholder data as fallback
      setStats({
        totalUsers: 25,
        totalPosts: 128,
        newUsersToday: 3,
        activeUsers: 12
      });
      
      // Sample data
      setRecentUsers([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }
      ]);
      
      setRecentPosts([
        { id: '1', title: 'First Post', username: 'John Doe', createdAt: new Date().toISOString() },
        { id: '2', title: 'Second Post', username: 'Jane Smith', createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
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
        {/* Sidebar */}
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
                className="mt-2 flex items-center px-4 py-2 text-sm rounded-md bg-gray-700 text-white hover:bg-gray-600"
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
                  className="flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
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
                
                <Link 
                  to="/admin/comments" 
                  className="flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Manage Comments
                </Link>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Settings</p>
              <Link 
                to="/admin/settings" 
                className="mt-2 flex items-center px-4 py-2 text-sm rounded-md text-white hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Settings
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Mobile sidebar toggle button */}
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
              <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
              
              {/* Stats Cards */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="text-sm">
                      <Link to="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
                        View all users
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Total Posts Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPosts}</dd>
                    </dl>
                  </div>
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="text-sm">
                      <Link to="/admin/posts" className="font-medium text-indigo-600 hover:text-indigo-500">
                        View all posts
                      </Link>
                    </div>
                  </div>
                </div>

                {/* New Users Today Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">New Users Today</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.newUsersToday}</dd>
                    </dl>
                  </div>
                </div>

                {/* Active Users Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Recent Users Table */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
                <div className="mt-4 flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                                Joined
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentUsers.map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.createdAt).toLocaleDateString()}
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

              {/* Recent Posts Table */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Recent Posts</h2>
                <div className="mt-4 flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Author
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentPosts.map((post) => (
                              <tr key={post.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{post.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(post.createdAt).toLocaleDateString()}
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

              {/* Admin Actions */}
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
                    <div className="mt-5">
                      <Link 
                        to="/admin/users" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Manage Users
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Content Moderation</h3>
                    <div className="mt-5">
                      <Link 
                        to="/admin/posts" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Moderate Posts
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">System Settings</h3>
                    <div className="mt-5">
                      <Link 
                        to="/admin/settings" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        System Settings
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
