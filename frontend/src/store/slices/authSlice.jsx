import { createSlice } from '@reduxjs/toolkit';

// Create a default user if none exists
const defaultUser = {
  id: '1',
  name: 'Default User',
  token: 'default-token'
};

// Get user from localStorage
let user = null;
try {
  user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    localStorage.setItem('user', JSON.stringify(defaultUser));
    user = defaultUser;
  }
} catch (error) {
  console.error('Error parsing user from localStorage:', error);
  localStorage.setItem('user', JSON.stringify(defaultUser));
  user = defaultUser;
}

// Simple login function to set username
export const setUsername = (username) => {
  const newUser = {
    id: Date.now().toString(),
    name: username,
    token: 'user-token-' + Date.now()
  };
  localStorage.setItem('user', JSON.stringify(newUser));
  return newUser;
};


const initialState = {
  user: user,
  isSuccess: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set username action
    setUser: (state, action) => {
      state.user = action.payload;
      state.isSuccess = true;
    },
    // Handle logout action
    logout: (state) => {
      state.user = defaultUser;
      state.isSuccess = false;
      // Add localStorage handling here to ensure it happens
      localStorage.removeItem('user');
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
  }
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
});

export const { reset, logout } = authSlice.actions;
export { logoutUser }; // Export the renamed function
export default authSlice.reducer;