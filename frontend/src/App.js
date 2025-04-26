import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminAddUser from "./pages/AdminAddUser";
import AdminBlockedUsers from "./pages/AdminBlockedUsers";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!user || !user.id) {
      return <Navigate to="/login" />;
    }
    
    if (user.role !== "ROLE_ADMIN") {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <AdminUserManagement />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/add" 
            element={
              <AdminRoute>
                <AdminAddUser />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users/blocked" 
            element={
              <AdminRoute>
                <AdminBlockedUsers />
              </AdminRoute>
            } 
          />
          {/* Add other routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
