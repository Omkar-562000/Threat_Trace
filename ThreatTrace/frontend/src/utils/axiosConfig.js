import axios from 'axios';
import { API_BASE } from './api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 422) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        '';

      const isTokenIssue =
        errorMessage.includes('Token') ||
        errorMessage.includes('token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('Subject must be a string') ||
        errorMessage.includes('Not enough segments') ||
        errorMessage.includes('Signature verification failed') ||
        errorMessage.includes('Authentication required') ||
        !localStorage.getItem('token');

      if (isTokenIssue) {
        console.log('Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      } else {
        console.warn('Permission denied but token is valid');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

