import React, { useState, useEffect, useCallback, useContext } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Divider, 
  Container, 
  InputAdornment,
  IconButton 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
// Import icons for a better look
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

function Register() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext); // Add AuthContext
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const errors = {};
    if (formData.firstName.length < 2) errors.firstName = "First name must be at least 2 characters";
    if (formData.lastName.length < 2) errors.lastName = "Last name must be at least 2 characters";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = "Invalid email format";
    if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Use axiosInstance and the correct port 8081
      await axiosInstance.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Registration failed. Please try again.";
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update Google callback handler
  const handleGoogleCallback = useCallback(async (response) => {
    console.log("Google response received:", response);
    setLoading(true);
    try {
      if (!response.credential) {
        throw new Error("No credential received from Google");
      }
      
      // Send the ID token to your backend with isRegistration flag
      const result = await axiosInstance.post("/api/auth/google", {
        idToken: response.credential,
        isRegistration: true
      });
      
      localStorage.setItem("user", JSON.stringify(result.data));
      setAuth({ isAuthenticated: true, user: result.data });
      navigate("/");
    } catch (err) {
      console.error("Google auth error:", err);
      const errorMessage = err.response?.data || err.message || "Google authentication failed";
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [navigate, setAuth]);

  // Add useEffect for Google Sign-In
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
              context: 'signup', // Changed to signup for registration context
              ux_mode: 'popup'
            });
  
            window.google.accounts.id.renderButton(
              document.getElementById("googleSignUpButton"),
              { 
                theme: "outline", 
                size: "large", 
                width: "100%",
                text: "signup_with", // Changed to signup_with
                shape: "rectangular"
              }
            );
          } catch (err) {
            console.error("Error initializing Google Sign-Up:", err);
            setError("Failed to initialize Google Sign-Up. Please try again later.");
          }
        } else {
          console.error("Google API failed to load");
          setError("Google Sign-Up is unavailable. Please try again later.");
        }
      }, 300);
    };

    script.onerror = () => {
      console.error("Failed to load Google Sign-In script");
      setError("Google Sign-Up is unavailable. Please try again later.");
    };

    return () => {
      // Clean up script when component unmounts
      const scriptToRemove = document.getElementById("google-signin-script");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [handleGoogleCallback]);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper 
          elevation={5} 
          sx={{ 
            p: 4, 
            borderRadius: '15px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(5px)',
            background: 'rgba(255, 255, 255, 0.97)',
            width: '100%',
            maxWidth: '450px'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              SkillBridge
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Create your account to get started
            </Typography>
          </Box>
          
          {error && (
            <Typography 
              color="error" 
              sx={{ 
                mb: 2, 
                p: 1, 
                borderRadius: 1, 
                bgcolor: 'rgba(255,0,0,0.05)',
                textAlign: 'center'
              }}
            >
              {error}
            </Typography>
          )}

          {/* Add Google Sign-Up Option First for Better UX */}
          <Box 
            id="googleSignUpButton" 
            sx={{ 
              width: "100%", 
              mb: 3,
              '& > div': {
                borderRadius: '10px !important',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1) !important',
                width: '100% !important',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15) !important',
                  transform: 'translateY(-1px)'
                }
              }
            }}
          />
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="textSecondary">
              OR
            </Typography>
          </Divider>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            
            <Button 
              type="submit" 
              fullWidth 
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5, 
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.9,
                  boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Typography variant="button" fontWeight="bold">
                {loading ? "Creating Account..." : "Register"}
              </Typography>
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <Typography
                  component="span"
                  color="primary"
                  fontWeight="bold"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Typography>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Register;
