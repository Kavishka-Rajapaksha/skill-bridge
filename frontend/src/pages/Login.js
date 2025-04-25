import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Clean up any existing Google script to prevent conflicts
    const existingScript = document.getElementById("google-signin-script");
    if (existingScript) {
      existingScript.remove();
    }
    
    // Load Google's OAuth script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-signin-script";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Add a slight delay to ensure Google's API is fully loaded
      setTimeout(() => {
        if (window.google) {
          try {
            window.google?.accounts.id.initialize({
              client_id: "793547860619-hccacc9oqnrjiphbve9hkvbef24o6sji.apps.googleusercontent.com",
              callback: handleGoogleCallback,
              auto_select: false,
              cancel_on_tap_outside: true,
              context: 'signin',
              // Set the correct type of flow - popup doesn't require redirect URI
              ux_mode: 'popup' // Use popup instead of redirect
            });
  
            window.google.accounts.id.renderButton(
              document.getElementById("googleSignInButton"),
              { 
                theme: "outline", 
                size: "large", 
                width: "100%",
                text: "signin_with",
                shape: "rectangular"
              }
            );
          } catch (err) {
            console.error("Error initializing Google Sign-In:", err);
            setError("Failed to initialize Google Sign-In. Please try again later.");
          }
        } else {
          console.error("Google API failed to load");
          setError("Google Sign-In is unavailable. Please try again later.");
        }
      }, 300);
    };

    script.onerror = () => {
      console.error("Failed to load Google Sign-In script");
      setError("Google Sign-In is unavailable. Please try again later.");
    };

    return () => {
      // Clean up script when component unmounts
      const scriptToRemove = document.getElementById("google-signin-script");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    console.log("Google response received:", response);
    try {
      if (!response.credential) {
        throw new Error("No credential received from Google");
      }
      
      // Send the ID token to your backend
      const result = await axiosInstance.post("/api/auth/google", {
        idToken: response.credential
      });
      
      localStorage.setItem("user", JSON.stringify(result.data));
      navigate("/");
    } catch (err) {
      console.error("Google auth error:", err);
      const errorMessage = err.response?.data || err.message || "Google authentication failed";
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/api/auth/login", formData);
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "An error occurred";
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login to LearnBook
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Login
          </Button>
          
          <Divider sx={{ my: 2 }}>OR</Divider>
          
          {/* Google Sign-In Button */}
          <Box id="googleSignInButton" sx={{ width: "100%", mt: 1 }}></Box>
          
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate("/register")}
            sx={{ mt: 3 }}
          >
            Don't have an account? Register
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Login;
