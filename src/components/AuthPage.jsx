import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const { saveAuth, api } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    adminSecret: '',
  });
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            ...(form.role === 'admin' ? { adminSecret: form.adminSecret } : {}),
          };
      const response = await api.post(endpoint, payload);
      saveAuth({ token: response.data.data.token, user: response.data.data.user });

      // Prevent back navigation after login
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = function () {
        window.history.pushState(null, null, window.location.href);
      };
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data;
      setMessage(serverMessage || error.message || 'Unable to process request.');
    }
  };

  useEffect(() => {
    // Clear any existing back navigation prevention
    window.onpopstate = null;
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Quota Management System</h1>
          <p>{isLogin ? 'Sign in to your account' : 'Create your account'}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {form.role === 'admin' && (
                <div className="form-group">
                  <label htmlFor="adminSecret">Admin Secret</label>
                  <input
                    id="adminSecret"
                    name="adminSecret"
                    type="password"
                    value={form.adminSecret}
                    onChange={handleChange}
                    required
                    placeholder="Enter admin secret"
                  />
                </div>
              )}
            </>
          )}

          <button type="submit" className="auth-button">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('success') || message.includes('Welcome') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="auth-toggle">
          <span>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="link-button"
            onClick={() => setIsLogin((prev) => !prev)}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;