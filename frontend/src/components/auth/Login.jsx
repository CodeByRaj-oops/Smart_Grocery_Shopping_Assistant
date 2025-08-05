import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
} from '@mui/material';
import { setUsername, setUser } from '../../store/slices/authSlice';

const Login = () => {
  const [username, setUsernameInput] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isSuccess } = useSelector((state) => state.auth);

  useEffect(() => {
    // If already logged in, redirect to home
    if (user && user.id !== '1') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSuccess) {
      navigate('/');
    }
  }, [isSuccess, navigate]);

  const onChange = (e) => {
    setUsernameInput(e.target.value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (username.trim()) {
      const newUser = setUsername(username);
      dispatch(setUser(newUser));
      navigate('/');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={8} md={6} lg={4}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Enter Your Username
            </Typography>

            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={onChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={!username.trim()}
              >
                Continue
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;