// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempToken, setTempToken] = useState(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setTempToken(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await apiService.getProfile();
        setUser(response.data);
        localStorage.setItem('user_data', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error.message === 'AUTH_EXPIRED') {
        setShowSessionExpired(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);

      if (response.requires_2fa) {
        setTempToken(response.temp_token);
        return { requires2FA: true, tempToken: response.temp_token };
      } else {
        localStorage.setItem('auth_token', response.token);

        // **ส่วนที่ถูกแก้ไข: เรียก getProfile เพื่อดึงข้อมูลที่สมบูรณ์**
        const userProfileResponse = await apiService.getProfile();
        const userData = userProfileResponse.data;

        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
        return { requires2FA: false, user: userData };
      }
    } catch (error) {
      throw error;
    }
  };

  const verify2FA = async (code) => {
    try {
      const response = await apiService.verify2FA(tempToken, code);
      localStorage.setItem('auth_token', response.token);

      // **ส่วนที่ถูกแก้ไข: เรียก getProfile เพื่อดึงข้อมูลที่สมบูรณ์**
      const userProfileResponse = await apiService.getProfile();
      const userData = userProfileResponse.data;

      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      setTempToken(null);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    tempToken,
    login,
    verify2FA,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    showSessionExpired,
    setShowSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};