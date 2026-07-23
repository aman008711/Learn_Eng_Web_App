import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT access tokens into request headers
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept unauthorized requests and try silent refreshes using the refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: new_refresh_token } = response.data;
          
          // Update credentials store
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().setAuth(user, access_token, new_refresh_token || refreshToken);
          } else {
            useAuthStore.getState().setAccessToken(access_token);
            if (new_refresh_token) {
              localStorage.setItem('refresh_token', new_refresh_token);
            }
          }
          
          // Retry the request that failed with updated bearer token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Token renewal failed: clear credentials and redirect to login
          useAuthStore.getState().clearAuth();
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
