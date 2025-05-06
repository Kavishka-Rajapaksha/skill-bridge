import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import ConnectionErrorModal from './components/common/ConnectionErrorModal';
import api from './services/api';

function App() {
  const [connectionError, setConnectionError] = useState(false);

  const checkBackendConnection = async () => {
    try {
      await api.get('/health'); // Assuming you have a health endpoint
      setConnectionError(false);
    } catch (error) {
      setConnectionError(true);
    }
  };

  useEffect(() => {
    checkBackendConnection();
    // Check connection every minute
    const intervalId = setInterval(checkBackendConnection, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRetryConnection = () => {
    checkBackendConnection();
  };

  return (
    <Router>
      <ConnectionErrorModal 
        show={connectionError} 
        onRetry={handleRetryConnection}
        onClose={() => setConnectionError(false)}
      />
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/about" component={About} />
      </Switch>
    </Router>
  );
}

export default App;