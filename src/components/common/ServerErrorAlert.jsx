import React, { useState } from 'react';
import { retryConnection, getDiagnostics } from '../../utils/serverStatus';

const ServerErrorAlert = ({ onRetry }) => {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await retryConnection(3, 1000);
      if (result.isRunning) {
        if (onRetry) onRetry(result);
      } else {
        const diagInfo = await getDiagnostics();
        setDiagnostics(diagInfo);
      }
    } catch (error) {
      console.error("Error during retry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto my-8">
      <div className="flex items-center text-red-600 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold">Connection Error</h2>
      </div>
      
      <p className="mb-4 text-gray-700">
        Cannot connect to the server. Please check if your backend server is running.
      </p>
      
      <ul className="mb-6 text-gray-600 list-disc pl-6 space-y-2">
        <li>Make sure your backend server is running on port 8081</li>
        <li>Check your internet connection</li>
        <li>Verify that your backend service is properly configured</li>
        <li>Try restarting your backend server</li>
      </ul>

      {diagnostics && showDetails && (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-medium mb-2 text-gray-800">Diagnostics:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRetry}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Try Again'}
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
        >
          Go to Homepage
        </button>
        
        {diagnostics && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ServerErrorAlert;
