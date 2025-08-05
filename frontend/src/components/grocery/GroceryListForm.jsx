import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  getGroceryList,
  createGroceryList,
  updateGroceryList,
  clearCurrentList,
} from '../../store/slices/groceryListsSlice';

const GroceryListForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { currentList, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.groceryLists
  );
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [],
  });
  
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'item',
    note: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  
  // Units for dropdown
  const units = [
    'item',
    'kg',
    'g',
    'lb',
    'oz',
    'l',
    'ml',
    'cup',
    'tbsp',
    'tsp',
    'bunch',
    'package',
    'can',
    'bottle',
    'box',
  ];
  
  useEffect(() => {
    // Auto-create user if not exists
    if (!user) {
      const defaultUser = {
        id: '1',
        name: 'Default User',
        email: 'user@example.com',
        token: 'default-token',
        refreshToken: 'default-refresh-token'
      };
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
    
    if (isEditMode && (!currentList || currentList._id !== id)) {
      dispatch(getGroceryList(id));
    }
    
    return () => {
      dispatch(clearCurrentList());
    };
  }, [user, navigate, dispatch, isEditMode, id, currentList]);
  
  useEffect(() => {
    if (isEditMode && currentList) {
      setFormData({
        name: currentList.name || '',
        description: currentList.description || '',
        items: currentList.items || [],
      });
    }
  }, [isEditMode, currentList]);
  
  useEffect(() => {
    if (isSuccess && !isLoading) {
      navigate('/lists');
    }
  }, [isSuccess, isLoading, navigate]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'List name is required';
    }
    
    if (formData.items.length === 0) {
      errors.items = 'Add at least one item to your list';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateItem = () => {
    const errors = {};
    
    if (!newItem.name.trim()) {
      errors.name = 'Item name is required';
    }
    
    if (newItem.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }
  };
  
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    setNewItem({
      ...newItem,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value,
    });
    
    // Clear error when user types
    if (itemErrors[name]) {
      setItemErrors({
        ...itemErrors,
        [name]: undefined,
      });
    }
  };
  
  const handleAddItem = () => {
    if (validateItem()) {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            ...newItem,
            id: Date.now().toString(), // Temporary ID for UI purposes
            isCompleted: false,
          },
        ],
      });
      
      // Clear the new item form
      setNewItem({
        name: '',
        quantity: 1,
        unit: 'item',
        note: '',
      });
      
      // Clear any form errors related to items
      if (formErrors.items) {
        setFormErrors({
          ...formErrors,
          items: undefined,
        });
      }
    }
  };
  
  const handleRemoveItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (isEditMode) {
        dispatch(updateGroceryList({
          id,
          listData: formData,
        }));
      } else {
        dispatch(createGroceryList(formData));
      }
    }
  };
  
  if (isEditMode && isLoading && !currentList) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/lists')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Grocery List' : 'Create Grocery List'}
        </Typography>
      </Box>
      
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="List Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Items
        </Typography>
        
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={newItem.name}
              onChange={handleItemChange}
              error={!!itemErrors.name}
              helperText={itemErrors.name}
              required
            />
          </Grid>
          
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={newItem.quantity}
              onChange={handleItemChange}
              error={!!itemErrors.quantity}
              helperText={itemErrors.quantity}
              InputProps={{
                inputProps: { min: 0, step: 0.1 },
              }}
              required
            />
          </Grid>
          
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              select
              label="Unit"
              name="unit"
              value={newItem.unit}
              onChange={handleItemChange}
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Note (Optional)"
              name="note"
              value={newItem.note}
              onChange={handleItemChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItem}
              fullWidth
              sx={{ height: '56px' }}
            >
              <AddIcon />
            </Button>
          </Grid>
        </Grid>
        
        {formErrors.items && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {formErrors.items}
          </Typography>
        )}
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Items ({formData.items.length})
          </Typography>
          
          {formData.items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
              No items added yet. Add items to your grocery list above.
            </Typography>
          ) : (
            <List>
              {formData.items.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <>
                          {`${item.quantity} ${item.unit}`}
                          {item.note && ` • ${item.note}`}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveItem(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < formData.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/lists')}
          startIcon={<ArrowBackIcon />}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          startIcon={<SaveIcon />}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            isEditMode ? 'Update List' : 'Create List'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default GroceryListForm;