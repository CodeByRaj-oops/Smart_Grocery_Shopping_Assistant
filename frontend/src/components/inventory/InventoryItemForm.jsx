import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { Save, ArrowBack } from '@mui/icons-material';
import { getInventory, addInventoryItem, updateInventoryItem, reset } from '../../store/slices/inventorySlice';

const InventoryItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { inventory, isLoading, isSuccess, isError, message } = useSelector((state) => state.inventory);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    unit: '',
    purchaseDate: new Date(),
    expirationDate: null,
    location: 'pantry',
    notes: '',
    price: 0,
    lowStockThreshold: 1,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Locations and units for dropdown
  const locations = ['pantry', 'refrigerator', 'freezer', 'other'];
  const units = ['', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'pcs', 'box', 'can', 'bottle', 'pack'];
  
  // Check if we're editing an existing item
  const isEditMode = Boolean(id);
  
  const { user } = useSelector((state) => state.auth);

  // Load inventory data and populate form if in edit mode
  useEffect(() => {
    // Only fetch inventory if user is authenticated (not the default user)
    if (user && user.id !== '1') {
      dispatch(getInventory());
    }
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch, user]);
  
  // Populate form with existing item data when in edit mode
  useEffect(() => {
    if (isEditMode && inventory?.items) {
      const itemToEdit = inventory.items.find(item => item._id === id);
      
      if (itemToEdit) {
        setFormData({
          name: itemToEdit.name || '',
          category: itemToEdit.category || '',
          quantity: itemToEdit.quantity || 1,
          unit: itemToEdit.unit || '',
          purchaseDate: itemToEdit.purchaseDate ? new Date(itemToEdit.purchaseDate) : new Date(),
          expirationDate: itemToEdit.expirationDate ? new Date(itemToEdit.expirationDate) : null,
          location: itemToEdit.location || 'pantry',
          notes: itemToEdit.notes || '',
          price: itemToEdit.price || 0,
          lowStockThreshold: itemToEdit.lowStockThreshold || 1,
        });
      } else {
        // Item not found, redirect to inventory page
        navigate('/inventory');
      }
    }
  }, [isEditMode, inventory, id, navigate]);
  
  // Reset form after successful submission
  useEffect(() => {
    if (isSubmitting && isSuccess) {
      setIsSubmitting(false);
      navigate('/inventory');
    }
  }, [isSuccess, isSubmitting, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (formData.lowStockThreshold <= 0) {
      newErrors.lowStockThreshold = 'Threshold must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      if (isEditMode) {
        dispatch(updateInventoryItem({
          id,
          itemData: formData
        }));
      } else {
        dispatch(addInventoryItem(formData));
      }
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inventory')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </Typography>
      </Box>
      
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Dairy, Produce, Meat"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={Boolean(errors.quantity)}
                helperText={errors.quantity}
                inputProps={{ min: 0, step: 0.1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="unit-label">Unit</InputLabel>
                <Select
                  labelId="unit-label"
                  name="unit"
                  value={formData.unit}
                  label="Unit"
                  onChange={handleChange}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit === '' ? 'None' : unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="location-label">Location</InputLabel>
                <Select
                  labelId="location-label"
                  name="location"
                  value={formData.location}
                  label="Location"
                  onChange={handleChange}
                  required
                >
                  {locations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Low Stock Threshold"
                name="lowStockThreshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                error={Boolean(errors.lowStockThreshold)}
                helperText={errors.lowStockThreshold}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChange={(date) => handleDateChange('purchaseDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expiration Date"
                  value={formData.expirationDate}
                  onChange={(date) => handleDateChange('expirationDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/inventory')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : isEditMode ? (
                    'Update Item'
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default InventoryItemForm;