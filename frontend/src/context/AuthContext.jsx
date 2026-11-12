import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medichain_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('medichain_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('medichain_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await authService.login(username, password);
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('medichain_token', res.data.token);
      localStorage.setItem('medichain_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    authService.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('medichain_token');
    localStorage.removeItem('medichain_user');
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return '/admin';
      case 'MANUFACTURER': return '/manufacturer';
      case 'DISTRIBUTOR': return '/distributor';
      case 'WHOLESALER': return '/wholesaler';
      case 'PHARMACY': return '/pharmacy';
      default: return '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      getDashboardPath
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

