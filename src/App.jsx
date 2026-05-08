import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

const App = () => {
  const { auth, loading, logout } = useAuth();

  useEffect(() => {
    // Prevent back navigation when authenticated
    if (auth?.token) {
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = function () {
        window.history.pushState(null, null, window.location.href);
      };
    } else {
      window.onpopstate = null;
    }

    // Check token expiry periodically
    const checkTokenExpiry = () => {
      if (auth?.token) {
        try {
          const tokenData = JSON.parse(atob(auth.token.split('.')[1]));
          const expiryTime = tokenData.exp * 1000;
          if (Date.now() >= expiryTime) {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [auth, logout]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return auth?.token ? (
    auth.user?.role === 'admin' ? (
      <AdminDashboard />
    ) : (
      <UserDashboard />
    )
  ) : (
    <AuthPage />
  );
};

export default App;