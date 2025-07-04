import React, { createContext, useState, useContext, useEffect } from 'react';
import { customerAPI } from '../utils/api';

const CustomerAuthContext = createContext({});

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
};

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if customer is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await customerAPI.verifyToken();
      if (response.success) {
        setCustomer(response.customer);
      } else {
        localStorage.removeItem('customerToken');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('customerToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await customerAPI.login(email, password);
      
      if (response.success) {
        localStorage.setItem('customerToken', response.token);
        setCustomer(response.customer);
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await customerAPI.register(userData);
      
      if (response.success) {
        localStorage.setItem('customerToken', response.token);
        setCustomer(response.customer);
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await customerAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('customerToken');
      setCustomer(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await customerAPI.forgotPassword(email);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send reset email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      const response = await customerAPI.resetPassword(token, newPassword);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await customerAPI.updateProfile(profileData);
      
      if (response.success) {
        setCustomer(response.customer);
        return { success: true };
      } else {
        setError(response.message || 'Update failed');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    customer,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!customer,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};