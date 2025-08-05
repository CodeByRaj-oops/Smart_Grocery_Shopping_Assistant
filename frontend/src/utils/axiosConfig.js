import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: user.refreshToken,
          });
          
          if (response.data) {
            // Update the user in localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
            
            // Update the authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            
            // Retry the original request
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Create a default user if refresh fails
        const defaultUser = {
          id: '1',
          name: 'Default User',
          email: 'user@example.com',
          token: 'default-token',
          refreshToken: 'default-refresh-token'
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
        // Update headers with default token
        originalRequest.headers['Authorization'] = `Bearer ${defaultUser.token}`;
        return axiosInstance(originalRequest);
      }
    }
    
    // If the error is 401 and we've already tried to refresh, use default user
    if (error.response.status === 401) {
      const defaultUser = {
        id: '1',
        name: 'Default User',
        email: 'user@example.com',
        token: 'default-token',
        refreshToken: 'default-refresh-token'
      };
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;