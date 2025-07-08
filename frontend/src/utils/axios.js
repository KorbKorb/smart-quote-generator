import axios from 'axios';

// When using proxy in development, we don't need the full URL
// The proxy in package.json will handle routing to the backend
const isDevelopment = process.env.NODE_ENV === 'development';

// Set the base URL for all axios requests
if (!isDevelopment) {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
}

// Add request interceptor to include auth token if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

export default axios;
