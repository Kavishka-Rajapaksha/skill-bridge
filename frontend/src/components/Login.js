import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const API_BASE_URL = 'http://localhost:8081';
  
  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate the required fields
      if (!loginData.email.trim() || !loginData.password.trim()) {
        setError('Email and password are required');
        setIsSubmitting(false);
        return;
      }
      
      // Try login endpoint
      let response;
      try {
        response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: loginData.email.trim(),
          password: loginData.password
        });
      } catch (firstError) {
        // Fallback to alternative endpoint
        response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
          email: loginData.email.trim(),
          password: loginData.password
        });
      }
      
      // Handle successful login
      const { token, user } = response.data;
      
      // Save auth info to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id || user._id);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to home page or dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Network Error') {
        setError('Server is not responding. Please ensure the backend server is running.');
      } else if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (error.response.status === 404) {
          setError('API endpoint not found. Please contact the administrator.');
        } else if (error.response.data && typeof error.response.data === 'string') {
          setError(error.response.data);
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`Error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else {
        setError('Failed to login. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={loginData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Don't have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
