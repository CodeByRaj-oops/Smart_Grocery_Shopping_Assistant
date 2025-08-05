import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  CheckCircle,
  LocalOffer as TagIcon,
  AttachMoney as MoneyIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import {
  getGroceryList,
  updateGroceryList,
  deleteGroceryList,
} from '../store/slices/groceryListsSlice';

const GroceryListDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { currentList, isLoading, isError, message } = useSelector(
    (state) => state.groceryLists
  );
  
  const [items, setItems] = useState([]);
  const [sortOption, setSortOption] = useState('default');
  const [filterOption, setFilterOption] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
  
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
      dispatch(getGroceryList(id));
    } else {
      dispatch(getGroceryList(id));
    }
  }, [user, navigate, dispatch, id]);
  
  useEffect(() => {
    if (currentList && currentList.items) {
      setItems(currentList.items);
    }
  }, [currentList]);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleOptionsMenuOpen = (event) => {
    setOptionsAnchorEl(event.currentTarget);
  };
  
  const handleOptionsMenuClose = () => {
    setOptionsAnchorEl(null);
  };
  
  const handleSortChange = (option) => {
    setSortOption(option);
    handleMenuClose();
  };
  
  const handleFilterChange = (option) => {
    setFilterOption(option);
    handleMenuClose();
  };
  
  const handleItemCheck = (itemId) => {
    const updatedItems = items.map((item) =>
      item._id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    
    setItems(updatedItems);
    
    // Update the list in the backend
    const updatedList = {
      ...currentList,
      items: updatedItems,
    };
    
    dispatch(updateGroceryList({ id, listData: updatedList }));
  };
  
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleOptionsMenuClose();
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const confirmDelete = () => {
    dispatch(deleteGroceryList(id));
    closeDeleteDialog();
    navigate('/lists');
  };
  
  const handleEditList = () => {
    navigate(`/lists/edit/${id}`);
    handleOptionsMenuClose();
  };
  
  const handleShareList = () => {
    navigate(`/lists/share/${id}`);
    handleOptionsMenuClose();
  };
  
  // Calculate completion percentage
  const completedItems = items.filter((item) => item.isCompleted).length;
  const completionPercentage = items.length > 0 
    ? Math.round((completedItems / items.length) * 100) 
    : 0;
  
  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      if (filterOption === 'completed') {
        return item.isCompleted;
      } else if (filterOption === 'pending') {
        return !item.isCompleted;
      }
      return true;
    })
    .sort((a, b) => {
      // Always show uncompleted items first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // Then apply the selected sort option
      if (sortOption === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'quantity') {
        return b.quantity - a.quantity;
      } else if (sortOption === 'category') {
        // If categories exist, sort by them
        return (a.category || '').localeCompare(b.category || '');
      }
      
      // Default sorting (by order in the array)
      return 0;
    });
  
  if (isLoading || !currentList) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {message || 'Failed to load grocery list'}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/lists')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {currentList.name}
        </Typography>
        
        <IconButton onClick={handleOptionsMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={optionsAnchorEl}
          open={Boolean(optionsAnchorEl)}
          onClose={handleOptionsMenuClose}
        >
          <MenuItem onClick={handleEditList}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit List
          </MenuItem>
          <MenuItem onClick={handleShareList}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Share List
          </MenuItem>
          <MenuItem onClick={openDeleteDialog}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error">Delete List</Typography>
          </MenuItem>
        </Menu>
      </Box>
      
      {currentList.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {currentList.description}
        </Typography>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={completionPercentage} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {completionPercentage}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {completedItems} of {items.length} items completed
            </Typography>
          </Box>
          
          <Box>
            <Chip 
              icon={currentList.isCompleted ? <CheckCircle /> : <ShoppingCart />} 
              label={currentList.isCompleted ? "Completed" : "Active"} 
              color={currentList.isCompleted ? "success" : "primary"} 
              variant="outlined" 
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2">
              Created: {new Date(currentList.createdAt).toLocaleDateString()}
            </Typography>
            {currentList.estimatedTotal && (
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                Estimated Total: ${currentList.estimatedTotal.toFixed(2)}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<RouteIcon />}
              onClick={() => navigate(`/lists/${id}/route`)}
              sx={{ mr: 1 }}
            >
              Optimize Route
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate(`/lists/edit/${id}`)}
            >
              Add Items
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Items ({filteredItems.length})
          </Typography>
          
          <Box>
            <IconButton onClick={handleMenuOpen}>
              <FilterListIcon />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2">Filter By</Typography>
              </MenuItem>
              <MenuItem 
                onClick={() => handleFilterChange('all')}
                selected={filterOption === 'all'}
              >
                All Items
              </MenuItem>
              <MenuItem 
                onClick={() => handleFilterChange('pending')}
                selected={filterOption === 'pending'}
              >
                Pending Items
              </MenuItem>
              <MenuItem 
                onClick={() => handleFilterChange('completed')}
                selected={filterOption === 'completed'}
              >
                Completed Items
              </MenuItem>
              
              <Divider />
              
              <MenuItem disabled>
                <Typography variant="subtitle2">Sort By</Typography>
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange('default')}
                selected={sortOption === 'default'}
              >
                <ListItemIcon>
                  <SortIcon fontSize="small" />
                </ListItemIcon>
                Default
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange('alphabetical')}
                selected={sortOption === 'alphabetical'}
              >
                <ListItemIcon>
                  <SortIcon fontSize="small" />
                </ListItemIcon>
                Alphabetical
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange('quantity')}
                selected={sortOption === 'quantity'}
              >
                <ListItemIcon>
                  <SortIcon fontSize="small" />
                </ListItemIcon>
                Quantity
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange('category')}
                selected={sortOption === 'category'}
              >
                <ListItemIcon>
                  <SortIcon fontSize="small" />
                </ListItemIcon>
                Category
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        
        <Divider />
        
        {filteredItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No items found
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              onClick={() => navigate(`/lists/edit/${id}`)}
            >
              Add Items
            </Button>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredItems.map((item, index) => {
              const labelId = `checkbox-list-label-${item._id}`;
              
              return (
                <React.Fragment key={item._id || index}>
                  <ListItem
                    secondaryAction={
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity} {item.unit}
                      </Typography>
                    }
                    disablePadding
                  >
                    <ListItemButton role={undefined} onClick={() => handleItemCheck(item._id)} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={item.isCompleted}
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        id={labelId}
                        primary={
                          <Typography
                            variant="body1"
                            style={{
                              textDecoration: item.isCompleted ? 'line-through' : 'none',
                              color: item.isCompleted ? 'text.disabled' : 'text.primary',
                            }}
                          >
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          item.note && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              style={{
                                textDecoration: item.isCompleted ? 'line-through' : 'none',
                              }}
                            >
                              {item.note}
                            </Typography>
                          )
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredItems.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Grocery List</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{currentList.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroceryListDetail;