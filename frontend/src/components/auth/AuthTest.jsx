import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { logout } from '../../store/slices/authSlice';

const AuthTest = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={8} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Authentication Test
            </Typography>
            
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current User:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="ID" secondary={user?.id || 'Not available'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Name" secondary={user?.name || 'Not available'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={user?.email || 'Not available'} />
                </ListItem>
              </List>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/register')}
                >
                  Go to Register
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthTest;