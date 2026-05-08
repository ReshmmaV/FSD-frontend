import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api';

const AuthContext = createContext(null);

const storageKey = 'quota-request-auth';

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuth(parsed);
        setAuthToken(parsed.token);
      } catch (error) {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, []);

  const saveAuth = (data) => {
    setAuth(data);
    setAuthToken(data.token);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    setAuthToken(null);
    localStorage.removeItem(storageKey);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, saveAuth, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
