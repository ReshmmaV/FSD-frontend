import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const UserDashboard = () => {
  const { auth, api, logout } = useAuth();
  const [quota, setQuota] = useState({ tier: '', quotaLimit: 0, quotaUsed: 0, remaining: 0 });
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState(null);
  const [requestType, setRequestType] = useState('API Access');
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [logsPagination, setLogsPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1 });

  const fetchQuota = async () => {
    try {
      const response = await api.get('/user/quota');
      setQuota(response.data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load quota.');
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const response = await api.get('/user/logs', { params: { page, limit: 10 } });
      setLogs(response.data.data);
      setLogsPagination(response.data.pagination);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load history.');
    }
  };

  const handleRequest = async () => {
    setMessage(null);
    try {
      const response = await api.post('/user/request', { requestType });
      setQuota({
        tier: response.data.data.tier,
        quotaLimit: response.data.data.quotaLimit,
        quotaUsed: response.data.data.quotaUsed,
        remaining: response.data.data.remaining,
      });
      await fetchLogs();
      setMessage('Request sent successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Request failed.');
    }
  };

  const calculateTokenTimeRemaining = () => {
    if (!auth.token) return null;

    try {
      const tokenData = JSON.parse(atob(auth.token.split('.')[1]));
      const expiryTime = tokenData.exp * 1000;
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        logout();
        return null;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      return `${days}d ${hours}h ${minutes}m`;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchQuota();
    fetchLogs();

    // Set up token expiry check
    const interval = setInterval(() => {
      const remaining = calculateTokenTimeRemaining();
      setTokenExpiry(remaining);
      if (!remaining) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    if (quota.quotaLimit === 0) return 0;
    return Math.min((quota.quotaUsed / quota.quotaLimit) * 100, 100);
  }, [quota.quotaLimit, quota.quotaUsed]);

  return (
    <div className="app-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {auth.user.name}!</h2>
          <p>Manage your API quota and monitor your requests</p>
        </div>

        <div className="dashboard-grid">
          <div className="quota-card">
            <h3>Quota Information</h3>
            <div className="quota-stats">
              <div className="stat-item">
                <span className="stat-label">Limit</span>
                <span className="stat-value">{quota.quotaLimit}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Used</span>
                <span className="stat-value">{quota.quotaUsed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining</span>
                <span className="stat-value">{quota.remaining}</span>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{Math.round(progress)}% used</span>
            </div>
          </div>

          <div className="tier-card">
            <h3>Quota Tier</h3>
            <div className="tier-info">
              <span className="tier-label">Current Tier:</span>
              <span className={`tier-badge ${quota.tier?.toLowerCase() || 'free'}`}>
                {quota.tier || 'Free'}
              </span>
            </div>
            <p className="tier-description">
              {quota.tier === 'Bronze' && 'Starter tier with a small quota for testing and light usage.'}
              {quota.tier === 'Silver' && 'Standard tier for regular usage and development workflows.'}
              {quota.tier === 'Gold' && 'Advanced tier for heavier usage and frequent access.'}
              {quota.tier === 'Platinum' && 'Premium tier with the highest quota and priority usage.'}
              {!['Bronze', 'Silver', 'Gold', 'Platinum'].includes(quota.tier) &&
                'No tier assigned yet. Contact an administrator for access.'}
            </p>
          </div>

          <div className="token-card">
            <h3>Token Status</h3>
            <div className="token-info">
              <div className="token-status">
                <span className="status-label">Status:</span>
                <span className={`status-value ${tokenExpiry ? 'active' : 'expired'}`}>
                  {tokenExpiry ? 'Active' : 'Expired'}
                </span>
              </div>
              {tokenExpiry && (
                <div className="token-expiry">
                  <span className="expiry-label">Expires in:</span>
                  <span className="expiry-value">{tokenExpiry}</span>
                </div>
              )}
            </div>
          </div>

          <div className="request-card">
            <h3>Send Request</h3>
            <div className="request-form">
              <label>
                Request Type
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                >
                  <option value="API Access">API Access</option>
                  <option value="Generate Token">Generate Token</option>
                  <option value="Fetch Data">Fetch Data</option>
                  <option value="Custom Request">Custom Request</option>
                </select>
              </label>
              <button
                className="primary-button"
                onClick={handleRequest}
                disabled={quota.remaining === 0}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>

        <div className="history-card">
          <h3>Request History</h3>
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Request Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No requests yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.endpoint}</td>
                      <td>{log.method}</td>
                      <td>{log.requestType}</td>
                      <td>
                        <span className={`status-badge ${log.responseStatus}`}>
                          {log.responseStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;