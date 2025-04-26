import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await axiosInstance.get("/api/auth/me");
          setUser(response.data);
        }
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        delete axiosInstance.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post("/api/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
