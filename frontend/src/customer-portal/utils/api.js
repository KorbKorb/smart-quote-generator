import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with customer auth
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

export const customerAPI = {
  // Authentication
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/customer/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/customer/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/customer/logout');
    return response.data;
  },

  verifyToken: async () => {
    const response = await axiosInstance.get('/auth/customer/verify');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/customer/forgot', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await axiosInstance.post('/auth/customer/reset', { token, newPassword });
    return response.data;
  },

  resendVerificationEmail: async (email) => {
    const response = await axiosInstance.post('/auth/customer/resend-verification', { email });
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await axiosInstance.get('/customer/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axiosInstance.put('/customer/profile', profileData);
    return response.data;
  },

  // Quotes
  getQuotes: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosInstance.get(`/customer/quotes?${params}`);
    return response.data;
  },

  getQuoteById: async (id) => {
    const response = await axiosInstance.get(`/customer/quotes/${id}`);
    return response.data;
  },

  acceptQuote: async (id, acceptanceData = {}) => {
    const response = await axiosInstance.post(`/customer/quotes/${id}/accept`, acceptanceData);
    return response.data;
  },

  rejectQuote: async (id, reason) => {
    const response = await axiosInstance.post(`/customer/quotes/${id}/reject`, { reason });
    return response.data;
  },

  downloadQuotePDF: async (id) => {
    const response = await axiosInstance.get(`/customer/quotes/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Quote Requests
  createQuoteRequest: async (requestData) => {
    const response = await axiosInstance.post('/customer/quote-requests', requestData);
    return response.data;
  },

  uploadQuoteFiles: async (files, quoteRequestId) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (quoteRequestId) {
      formData.append('quoteRequestId', quoteRequestId);
    }

    const response = await axiosInstance.post('/customer/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Orders
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axiosInstance.get(`/customer/orders?${params}`);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await axiosInstance.get(`/customer/orders/${id}`);
    return response.data;
  },

  // Documents
  getDocuments: async (type = 'all') => {
    const response = await axiosInstance.get(`/customer/documents?type=${type}`);
    return response.data;
  },

  downloadDocument: async (id) => {
    const response = await axiosInstance.get(`/customer/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (dateRange = '30d') => {
    const response = await axiosInstance.get(`/customer/analytics?range=${dateRange}`);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await axiosInstance.get('/customer/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await axiosInstance.put(`/customer/notifications/${id}/read`);
    return response.data;
  },

  // Support
  createSupportTicket: async (ticketData) => {
    const response = await axiosInstance.post('/customer/support/tickets', ticketData);
    return response.data;
  },

  getSupportTickets: async () => {
    const response = await axiosInstance.get('/customer/support/tickets');
    return response.data;
  },
};

// Helper function to download files
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};