import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Fab,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Kitchen as KitchenIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  CheckCircle,
} from '@mui/icons-material';
import { getInventory, deleteInventoryItem } from '../store/slices/inventorySlice';

const Inventory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { inventory, isLoading } = useSelector((state) => state.inventory);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const filterMenuOpen = Boolean(filterAnchorEl);
  
  // Sort menu
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const sortMenuOpen = Boolean(sortAnchorEl);
  
  useEffect(() => {
    dispatch(getInventory());
  }, [dispatch]);
  
  // Handle item menu open
  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };
  
  // Handle item menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle sort menu
  const handleSortMenuOpen = (event) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };
  
  // Handle edit item
  const handleEditItem = () => {
    navigate(`/inventory/edit/${selectedItem._id}`);
    handleMenuClose();
  };
  
  // Handle delete dialog
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle delete item
  const handleDeleteItem = () => {
    dispatch(deleteInventoryItem(selectedItem._id));
    setDeleteDialogOpen(false);
  };
  
  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setFilterOption(filter);
    handleFilterMenuClose();
  };
  
  // Handle sort change
  const handleSortChange = (sort) => {
    setSortOption(sort);
    handleSortMenuClose();
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Filter and sort items
  const filteredItems = inventory.items ? inventory.items.filter((item) => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    let matchesFilter = true;
    if (filterOption !== 'all') {
      if (filterOption === 'lowStock') {
        matchesFilter = item.quantity <= item.lowStockThreshold;
      } else if (filterOption === 'expiringSoon') {
        const today = new Date();
        const expirationDate = new Date(item.expirationDate);
        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
        matchesFilter = daysUntilExpiration <= 7 && daysUntilExpiration > 0;
      } else if (filterOption === 'expired') {
        const today = new Date();
        const expirationDate = new Date(item.expirationDate);
        matchesFilter = expirationDate < today;
      } else {
        matchesFilter = item.location === filterOption;
      }
    }
    
    return matchesSearch && matchesFilter;
  }) : [];
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'quantity') {
      return b.quantity - a.quantity;
    } else if (sortOption === 'expirationDate') {
      if (!a.expirationDate) return 1;
      if (!b.expirationDate) return -1;
      return new Date(a.expirationDate) - new Date(b.expirationDate);
    } else if (sortOption === 'purchaseDate') {
      return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    }
    return 0;
  });
  
  // Group items by location for the location view
  const itemsByLocation = {
    pantry: sortedItems.filter(item => item.location === 'pantry'),
    refrigerator: sortedItems.filter(item => item.location === 'refrigerator'),
    freezer: sortedItems.filter(item => item.location === 'freezer'),
    other: sortedItems.filter(item => item.location === 'other'),
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Household Inventory
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/inventory/new')}
        >
          Add Item
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="All Items" />
          <Tab label="By Location" />
        </Tabs>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search inventory..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '40%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <Button
            startIcon={<FilterListIcon />}
            onClick={handleFilterMenuOpen}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button
            startIcon={<SortIcon />}
            onClick={handleSortMenuOpen}
          >
            Sort
          </Button>
        </Box>
      </Box>
      
      {currentTab === 0 ? (
        // All items view
        <Grid container spacing={3}>
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2">
                        {item.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, item)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {item.quantity} {item.unit} {item.category && `• ${item.category}`}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        icon={<KitchenIcon />} 
                        label={item.location.charAt(0).toUpperCase() + item.location.slice(1)} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }}
                      />
                      
                      {item.expirationDate && (
                        <Chip 
                          icon={
                            new Date(item.expirationDate) < new Date() ? 
                              <WarningIcon color="error" /> : 
                              <CheckCircle color="success" />
                          }
                          label={
                            new Date(item.expirationDate) < new Date() ?
                              `Expired: ${new Date(item.expirationDate).toLocaleDateString()}` :
                              `Expires: ${new Date(item.expirationDate).toLocaleDateString()}`
                          }
                          color={
                            new Date(item.expirationDate) < new Date() ? 
                              'error' : 
                              'default'
                          }
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Box>
                    
                    {item.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/inventory/edit/${item._id}`)}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">
                  No inventory items found.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {searchTerm || filterOption !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Add some items to your inventory to get started.'}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/inventory/new')}
                  sx={{ mt: 2 }}
                >
                  Add Item
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        // By location view
        <Box>
          {Object.entries(itemsByLocation).map(([location, items]) => (
            <Box key={location} sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {location.charAt(0).toUpperCase() + location.slice(1)}
              </Typography>
              {items.length > 0 ? (
                <Grid container spacing={3}>
                  {items.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" component="h2">
                              {item.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, item)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                          
                          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            {item.quantity} {item.unit} {item.category && `• ${item.category}`}
                          </Typography>
                          
                          {item.expirationDate && (
                            <Chip 
                              icon={
                                new Date(item.expirationDate) < new Date() ? 
                                  <WarningIcon color="error" /> : 
                                  <CheckCircle color="success" />
                              }
                              label={
                                new Date(item.expirationDate) < new Date() ?
                                  `Expired: ${new Date(item.expirationDate).toLocaleDateString()}` :
                                  `Expires: ${new Date(item.expirationDate).toLocaleDateString()}`
                              }
                              color={
                                new Date(item.expirationDate) < new Date() ? 
                                  'error' : 
                                  'default'
                              }
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                          
                          {item.notes && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {item.notes}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/inventory/edit/${item._id}`)}
                          >
                            Edit
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1">
                    No items in this location.
                  </Typography>
                </Paper>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      {/* Item actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditItem}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteDialogOpen}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      
      {/* Filter menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={filterMenuOpen}
        onClose={handleFilterMenuClose}
      >
        <MenuItem onClick={() => handleFilterChange('all')} selected={filterOption === 'all'}>
          All Items
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('lowStock')} selected={filterOption === 'lowStock'}>
          Low Stock
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('expiringSoon')} selected={filterOption === 'expiringSoon'}>
          Expiring Soon
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('expired')} selected={filterOption === 'expired'}>
          Expired
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleFilterChange('pantry')} selected={filterOption === 'pantry'}>
          Pantry
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('refrigerator')} selected={filterOption === 'refrigerator'}>
          Refrigerator
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('freezer')} selected={filterOption === 'freezer'}>
          Freezer
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('other')} selected={filterOption === 'other'}>
          Other
        </MenuItem>
      </Menu>
      
      {/* Sort menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={sortMenuOpen}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => handleSortChange('name')} selected={sortOption === 'name'}>
          Name
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('quantity')} selected={sortOption === 'quantity'}>
          Quantity
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('expirationDate')} selected={sortOption === 'expirationDate'}>
          Expiration Date
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('purchaseDate')} selected={sortOption === 'purchaseDate'}>
          Purchase Date
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Inventory Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedItem?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/inventory/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Inventory;