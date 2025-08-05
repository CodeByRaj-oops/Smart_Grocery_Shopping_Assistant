import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, reset } from '../../store/slices/authSlice';
import { getInventory } from '../../store/slices/inventorySlice';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

const TestAuth = () => {
  const [formData, setFormData] = useState({
    email: 'test@example.com',
    password: 'password123',
  });
  const [apiResponse, setApiResponse] = useState(null);

  const { email, password } = formData;

  const dispatch = useDispatch();

  const { user, isLoading: authLoading, isError: authError, message: authMessage } = useSelector(
    (state) => state.auth
  );

  const { inventory, isLoading: inventoryLoading, isError: inventoryError, message: inventoryMessage } = useSelector(
    (state) => state.inventory
  );

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  const testProtectedRoute = () => {
    dispatch(getInventory());
  };

  useEffect(() => {
    if (authError) {
      setApiResponse({
        type: 'error',
        message: authMessage,
      });
    }

    if (inventoryError) {
      setApiResponse({
        type: 'error',
        message: inventoryMessage,
      });
    }

    if (inventory && inventory.length > 0) {
      setApiResponse({
        type: 'success',
        message: 'Successfully fetched inventory data',
        data: inventory,
      });
    }

    return () => {
      dispatch(reset());
    };
  }, [authError, authMessage, inventoryError, inventoryMessage, inventory, dispatch]);

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Authentication Test
        </Typography>

        {apiResponse && (
          <Alert severity={apiResponse.type} sx={{ mb: 2 }}>
            {apiResponse.message}
          </Alert>
        )}

        <form onSubmit={onSubmit}>
          <TextField
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={authLoading}
          >
            {authLoading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={testProtectedRoute}
            disabled={!user || inventoryLoading}
          >
            {inventoryLoading ? <CircularProgress size={24} /> : 'Test Protected API Route'}
          </Button>
        </Box>

        {user && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Current User:</Typography>
            <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(user, null, 2)}
            </pre>
          </Box>
        )}

        {apiResponse && apiResponse.data && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">API Response Data:</Typography>
            <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(apiResponse.data, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TestAuth;