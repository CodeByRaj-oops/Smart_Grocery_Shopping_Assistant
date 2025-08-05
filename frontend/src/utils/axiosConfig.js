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
    if (user && user.accessToken) {
      config.headers.Authorization = `Bearer ${user.accessToken}`;
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
            // Update the user in localStorage with new access token
            const updatedUser = {
              ...user,
              accessToken: response.data.accessToken
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update the authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
            
            // Retry the original request
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, redirect to home page instead of login
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
  
);
// If refresh fails, redirect to home page instead of login
localStorage.removeItem('user');
window.location.href = '/';
export default axiosInstance;