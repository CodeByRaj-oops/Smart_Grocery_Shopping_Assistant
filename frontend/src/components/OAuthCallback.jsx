import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Box, Typography } from '@mui/material';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId = params.get('userId');
    const error = params.get('error');

    if (error) {
      console.error('OAuth Error:', error);
      navigate('/login', { state: { error } });
      return;
    }

    if (accessToken && refreshToken && userId) {
      // Create user object to store in localStorage
      const user = {
        _id: userId,
        accessToken,
        refreshToken
      };

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Update Redux state
      dispatch({
        type: 'auth/login/fulfilled',
        payload: user
      });

      // Redirect to home page
      navigate('/');
    } else {
      navigate('/login', { state: { error: 'Authentication failed' } });
    }
  }, [location, dispatch, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Processing your login...
      </Typography>
    </Box>
  );
};

export default OAuthCallback;