import React from 'react';
import { Link } from 'react-router-dom';

const ErrorPage = ({ error, resetError }) => {
  // Check if error is a CORS-related error
  const isCorsError = error && (
    error.includes("CORS") || 
    error.includes("Access-Control-Allow") || 
    error.includes("cross-origin")
  );

  return (
    <div className="error-container p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="error-message text-gray-700 mb-4">
        {error || 'Server is not responding. Please ensure the backend server is running.'}
      </p>
      <div className="error-actions flex space-x-4 mb-6">
        <button onClick={resetError} className="try-again-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Try Again
        </button>
        <Link to="/" className="go-home-link bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
          Go to Homepage
        </Link>
      </div>
      <div className="error-help-text bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-2">Common solutions:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Make sure your backend server is running</li>
          <li>Check your internet connection</li>
          <li>Verify API endpoints are configured correctly</li>
          {isCorsError && (
            <>
              <li className="text-red-600 font-medium">This appears to be a CORS policy issue</li>
              <li>Check that the backend server is configured to accept the 'userId' header</li>
              <li>Restart your backend server after making CORS configuration changes</li>
            </>
          )}
          <li>Contact support if the issue persists</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorPage;
