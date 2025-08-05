import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
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

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post('/api/users/refresh-token', {
            refreshToken: user.refreshToken,
          });
          
          // Update user in localStorage with new tokens
          const updatedUser = {
            ...user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
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
        originalRequest.headers.Authorization = `Bearer ${defaultUser.token}`;
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;