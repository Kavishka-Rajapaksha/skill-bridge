import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ConnectionErrorModal from '../components/common/ConnectionErrorModal';

function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnectionError, setShowConnectionError] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
      setError(null);
      setShowConnectionError(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
      if (error.message === 'Network Error') {
        setShowConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="container my-4">
      <h2>Groups</h2>
      
      {error && !showConnectionError && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {/* Groups listing */}
      <div className="row">
        {groups.map(group => (
          <div key={group.id} className="col-md-4 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{group.name}</h5>
                <p className="card-text">{group.description}</p>
                <a href={`/groups/${group.id}`} className="btn btn-primary">View Group</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Connection error modal */}
      <ConnectionErrorModal
        show={showConnectionError}
        onRetry={fetchGroups}
        onClose={() => setShowConnectionError(false)}
      />
    </div>
  );
}

export default GroupPage;
