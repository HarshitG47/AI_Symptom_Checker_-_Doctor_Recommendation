import axios from 'axios';

// Get base URL from env or default to relative path/proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (!config.headers) config.headers = {};
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-logout if token is expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the stale session data
      localStorage.removeItem('user');
      // Redirect to login page (avoid import cycle — just use window.location)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
