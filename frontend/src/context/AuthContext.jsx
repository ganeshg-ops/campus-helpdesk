import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Initialize active user from token if present
  useEffect(() => {
    async function initAuth() {
      try {
        const health = await api.getHealth().catch(() => ({ demo_mode: true }));
        setIsDemoMode(health.demo_mode ?? true);

        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          try {
            const me = await api.getMe();
            setUser(me);
            setToken(savedToken);
          } catch (e) {
            console.warn("Saved token expired or invalid, clearing session.");
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const studentLogin = async (email, password) => {
    const res = await api.studentLogin(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const adminLogin = async (email, password) => {
    const res = await api.adminLogin(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const studentRegister = async (data) => {
    const res = await api.studentRegister(data);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (data) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const switchDemoRole = async (role) => {
    try {
      setLoading(true);
      const res = await api.switchDemoUser(role);
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error("Role switch failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isDemoMode,
      studentLogin,
      adminLogin,
      login,
      studentRegister,
      updateProfile,
      logout,
      switchDemoRole,
      isAuthenticated: !!user,
      isStudent: user?.role === 'student',
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff' || user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
