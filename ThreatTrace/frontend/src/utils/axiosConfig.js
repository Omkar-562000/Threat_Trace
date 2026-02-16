// frontend/src/utils/axiosConfig.js
import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
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

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout and redirect if it's a token authentication issue
    // Don't logout on permission errors (403) or other 401s from role checks
    if (error.response?.status === 401 || error.response?.status === 422) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        '';
      
      // Check if it's actually a token expiry/invalid token issue
      // vs a role-based permission issue
      const isTokenIssue = 
        errorMessage.includes('Token') ||
        errorMessage.includes('token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('Subject must be a string') ||
        errorMessage.includes('Not enough segments') ||
        errorMessage.includes('Signature verification failed') ||
        errorMessage.includes('Authentication required') ||
        !localStorage.getItem('token'); // No token at all
      
      if (isTokenIssue) {
        console.log('🔒 Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      } else {
        // It's a permission/role issue, not a token issue
        console.warn('⚠️ Permission denied but token is valid');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
