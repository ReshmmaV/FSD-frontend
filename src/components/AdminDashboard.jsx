import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { auth, api, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [failedSummary, setFailedSummary] = useState([]);
  const [failedTotal, setFailedTotal] = useState(0);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  
  // Pagination states
  const [usersPagination, setUsersPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1 });
  const [logsPagination, setLogsPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1 });

  const fetchUsers = async (page = 1) => {
    try {
      const response = await api.get('/admin/users', { params: { page, limit: 10 } });
      setUsers(response.data.data);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load users.');
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const response = await api.get('/admin/logs', { params: { page, limit: 10 } });
      setLogs(response.data.data);
      setLogsPagination(response.data.pagination);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load logs.');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const fetchFailedSummary = async () => {
    try {
      const response = await api.get('/admin/failed-logs-summary', { params: { days: 7 } });
      setFailedSummary(response.data.data.failuresByReason || []);
      setFailedTotal(response.data.data.totalFailures || 0);
    } catch (error) {
      console.error('Failed to load failed request summary:', error);
    }
  };

  const updateQuota = async (userId, quotaLimit) => {
    if (quotaLimit === '') return;
    const parsed = Number(quotaLimit);
    if (isNaN(parsed) || parsed < 0) {
      setMessage('Enter a valid non-negative quota.');
      return;
    }
    try {
      await api.put(`/admin/set-quota/${userId}`, { quotaLimit: parsed });
      fetchUsers();
      setMessage('Quota updated successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update quota.');
    }
  };

  const resetUsage = async (userId) => {
    try {
      await api.put(`/admin/reset-usage/${userId}`);
      fetchUsers();
      setMessage('Usage reset successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset usage.');
    }
  };

  const toggleBlockUser = async (userId, isBlocked) => {
    try {
      await api.put(`/admin/block/${userId}`, { isBlocked: !isBlocked });
      fetchUsers();
      setMessage(`User ${!isBlocked ? 'blocked' : 'unblocked'} successfully!`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update user status.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchAnalytics();
    fetchFailedSummary();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesBlocked = blockedFilter === '' ||
                          (blockedFilter === 'blocked' && user.isBlocked) ||
                          (blockedFilter === 'active' && !user.isBlocked);
    return matchesSearch && matchesRole && matchesBlocked;
  });

  const userRequestsData = logs.reduce((acc, log) => {
    const userName = log.userId?.name || 'Unknown';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(userRequestsData).map(([name, requests]) => ({
    name,
    requests
  }));

  const statusData = [
    { name: 'Active Users', value: analytics.activeUsers || 0, color: '#10b981' },
    { name: 'Blocked Users', value: analytics.blockedUsers || 0, color: '#ef4444' }
  ];

  return (
    <div className="app-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Users</h3>
            <div className="analytics-value">{analytics.totalUsers || 0}</div>
          </div>
          <div className="analytics-card">
            <h3>Active Users</h3>
            <div className="analytics-value">{analytics.activeUsers || 0}</div>
          </div>
          <div className="analytics-card">
            <h3>Blocked Users</h3>
            <div className="analytics-value">{analytics.blockedUsers || 0}</div>
          </div>
          <div className="analytics-card">
            <h3>Requests Today</h3>
            <div className="analytics-value">{analytics.totalRequestsToday || 0}</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Requests per User</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>User Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="failed-summary-card">
          <h3>Failed Requests Summary</h3>
          <p className="summary-subtitle">Total failures in the last 7 days: {failedTotal}</p>
          <div className="summary-list">
            {failedSummary.length === 0 ? (
              <div className="no-data">No failed events recorded.</div>
            ) : (
              failedSummary.map((summary) => (
                <div key={summary._id} className="summary-item">
                  <span>{summary._id}</span>
                  <span>{summary.count} failures</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="users-management">
          <h3>User Management</h3>

          <div className="filters-section">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value)}>
                <option value="">All Users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Quota Limit</th>
                  <th>Quota Used</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`tier-badge ${user.tier?.toLowerCase() || 'free'}`}>
                        {user.tier || 'Free'}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        defaultValue={user.quotaLimit}
                        onBlur={(e) => updateQuota(user._id, e.target.value)}
                        className="quota-input"
                      />
                    </td>
                    <td>{user.quotaUsed}</td>
                    <td>{Math.max(user.quotaLimit - user.quotaUsed, 0)}</td>
                    <td>
                      <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn reset"
                          onClick={() => resetUsage(user._id)}
                          title="Reset Usage"
                        >
                          Reset
                        </button>
                        <button
                          className={`action-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                          onClick={() => toggleBlockUser(user._id, user.isBlocked)}
                          title={user.isBlocked ? 'Unblock User' : 'Block User'}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="logs-section">
          <h3>Request Logs</h3>
          <div className="table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Request Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No logs yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.userId?.name || 'Unknown'}</td>
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

export default AdminDashboard;