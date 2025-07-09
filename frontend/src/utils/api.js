// frontend/src/utils/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Debug log to verify correct API URL
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token (if needed in future)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Quote API endpoints
export const quoteAPI = {
  // Get all quotes with filters
  getQuotes: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/quotes${queryString ? `?${queryString}` : ''}`);
  },

  // Get single quote
  getQuote: (id) => api.get(`/quotes/${id}`),

  // Create new quote
  createQuote: (data) => api.post('/quotes', data),

  // Update quote status
  updateQuoteStatus: (id, status) => api.patch(`/quotes/${id}/status`, { status }),

  // Delete quote
  deleteQuote: (id) => api.delete(`/quotes/${id}`),

  // Calculate quote preview
  calculateQuote: (items) => api.post('/quotes/calculate', { items }),

  // Get materials
  getMaterials: () => api.get('/quotes/materials'),

  // Analyze DXF
  analyzeDXF: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/quotes/analyze-dxf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
