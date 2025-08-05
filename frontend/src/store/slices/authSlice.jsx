import { createSlice } from '@reduxjs/toolkit';

// Create a default user if none exists
const defaultUser = {
  id: '1',
  name: 'Default User',
  email: 'user@example.com',
  token: 'default-token',
  refreshToken: 'default-refresh-token'
};

// Always use the default user
if (!localStorage.getItem('user')) {
  localStorage.setItem('user', JSON.stringify(defaultUser));
}

const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: user,
  isLoading: false,
  isSuccess: true,
  isError: false,
  message: '',
};
  // Simplified auth slice with no API calls

// Renamed to logoutUser to avoid naming conflict
const logoutUser = () => {
  localStorage.removeItem('user');
  // Set default user again
  localStorage.setItem('user', JSON.stringify(defaultUser));
  return { type: 'auth/logout' };
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state.message = '';
    },
    // Handle logout action
    logout: (state) => {
      // We don't actually set user to null anymore
      // Instead we just reset the state
      state.isSuccess = true;
      state.isError = false;
      state.message = '';
      // Add localStorage handling here to ensure it happens
      localStorage.removeItem('user');
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
  }
});

export const { reset, logout } = authSlice.actions;
export { logoutUser }; // Export the renamed function
export default authSlice.reducer;