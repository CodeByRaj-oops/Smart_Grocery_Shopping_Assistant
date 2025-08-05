import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register, reset } from '../store/slices/authSlice';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  Link,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    householdName: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { name, email, password, password2, householdName } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      // Form validation errors can be handled here
    }

    if (isSuccess || user) {
      navigate('/');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!name) {
        errors.name = 'Name is required';
      }
      
      if (!email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Email is invalid';
      }
      
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (password !== password2) {
        errors.password2 = 'Passwords do not match';
      }
    } else if (step === 1) {
      if (!householdName) {
        errors.householdName = 'Household name is required';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    
    // Clear error when user types
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: undefined,
      });
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (validateStep(activeStep)) {
      const userData = {
        name,
        email,
        password,
        householdName,
      };

      dispatch(register(userData));
    }
  };

  const steps = ['Account Information', 'Household Setup', 'Review'];

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 1,
              mb: 2,
            }}
          >
            <PersonAddIcon sx={{ color: 'white' }} />
          </Box>
          <Typography component="h1" variant="h5" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join ShopSmartly to simplify your shopping
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {isError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} sx={{ width: '100%' }}>
            {activeStep === 0 && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={onChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={onChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={onChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password2"
                  label="Confirm Password"
                  type="password"
                  id="password2"
                  value={password2}
                  onChange={onChange}
                  error={!!formErrors.password2}
                  helperText={formErrors.password2}
                />
              </>
            )}

            {activeStep === 1 && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="householdName"
                  label="Household Name"
                  name="householdName"
                  value={householdName}
                  onChange={onChange}
                  error={!!formErrors.householdName}
                  helperText={formErrors.householdName}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Create a household to manage your grocery lists and inventory. You can invite family members later.
                </Typography>
              </>
            )}

            {activeStep === 2 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Review Your Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Full Name:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{name}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Email:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{email}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Household:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{householdName}</Typography>
                  </Grid>
                </Grid>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  By clicking Register, you agree to our Terms of Service and Privacy Policy.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Register'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>

            <Grid container justifyContent="center" sx={{ mt: 3 }}>
              <Grid item>
                <Link href="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;