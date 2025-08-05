import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
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
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user && user.refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post('/api/auth/refresh-token', {
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
        // If refresh fails, redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;