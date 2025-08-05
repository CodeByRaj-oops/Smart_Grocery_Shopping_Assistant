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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  ShoppingCart,
  CheckCircle,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { getGroceryLists, deleteGroceryList } from '../store/slices/groceryListsSlice';

const GroceryLists = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { groceryLists, isLoading } = useSelector((state) => state.groceryLists);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuListId, setMenuListId] = useState(null);
  
  useEffect(() => {
    // Only fetch grocery lists if user is authenticated (not the default user)
    if (user && user.id !== '1') {
      dispatch(getGroceryLists());
    }
  }, [user, dispatch]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleFilterChange = (option) => {
    setFilterOption(option);
    handleFilterMenuClose();
  };
  
  const handleSortChange = (option) => {
    setSortOption(option);
    handleFilterMenuClose();
  };
  
  const handleListMenuOpen = (event, listId) => {
    setMenuListId(listId);
    setAnchorEl(event.currentTarget);
  };
  
  const handleListMenuClose = () => {
    setMenuListId(null);
    setAnchorEl(null);
  };
  
  const openDeleteDialog = (list) => {
    setSelectedList(list);
    setDeleteDialogOpen(true);
    handleListMenuClose();
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedList(null);
  };
  
  const confirmDelete = () => {
    if (selectedList) {
      dispatch(deleteGroceryList(selectedList._id));
      closeDeleteDialog();
    }
  };
  
  const handleEditList = (listId) => {
    navigate(`/lists/edit/${listId}`);
    handleListMenuClose();
  };
  
  const handleShareList = (listId) => {
    navigate(`/lists/share/${listId}`);
    handleListMenuClose();
  };
  
  const handleViewList = (listId) => {
    navigate(`/lists/${listId}`);
  };
  
  // Filter and sort lists
  const filteredLists = groceryLists
    .filter((list) => {
      // Apply search filter
      const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      if (filterOption === 'active') {
        return matchesSearch && !list.isCompleted;
      } else if (filterOption === 'completed') {
        return matchesSearch && list.isCompleted;
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortOption === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOption === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOption === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'items') {
        return b.items.length - a.items.length;
      }
      
      return 0;
    });
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Grocery Lists
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/lists/new')}
        >
          New List
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search lists..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2 }}
        />
        
        <IconButton onClick={handleFilterMenuOpen}>
          <FilterListIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && !menuListId}
          onClose={handleFilterMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2">Filter By</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('all')}
            selected={filterOption === 'all'}
          >
            All Lists
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('active')}
            selected={filterOption === 'active'}
          >
            Active Lists
          </MenuItem>
          <MenuItem 
            onClick={() => handleFilterChange('completed')}
            selected={filterOption === 'completed'}
          >
            Completed Lists
          </MenuItem>
          
          <Divider />
          
          <MenuItem disabled>
            <Typography variant="subtitle2">Sort By</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortChange('newest')}
            selected={sortOption === 'newest'}
          >
            <ListItemIcon>
              <SortIcon fontSize="small" />
            </ListItemIcon>
            Newest First
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortChange('oldest')}
            selected={sortOption === 'oldest'}
          >
            <ListItemIcon>
              <SortIcon fontSize="small" />
            </ListItemIcon>
            Oldest First
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
            onClick={() => handleSortChange('items')}
            selected={sortOption === 'items'}
          >
            <ListItemIcon>
              <SortIcon fontSize="small" />
            </ListItemIcon>
            Most Items
          </MenuItem>
        </Menu>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && Boolean(menuListId)}
          onClose={handleListMenuClose}
        >
          <MenuItem onClick={() => handleEditList(menuListId)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleShareList(menuListId)}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Share
          </MenuItem>
          <MenuItem onClick={() => openDeleteDialog(groceryLists.find(list => list._id === menuListId))}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error">Delete</Typography>
          </MenuItem>
        </Menu>
      </Box>
      
      {filteredLists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No grocery lists found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try a different search term' : 'Create your first grocery list to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/lists/new')}
          >
            Create List
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredLists.map((list) => (
            <Grid item xs={12} sm={6} md={4} key={list._id}>
              <Card 
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {list.name}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleListMenuOpen(e, list._id)}
                      sx={{ mt: -1, mr: -1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {list.isCompleted ? (
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Completed" 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                      />
                    ) : (
                      <Chip 
                        icon={<ShoppingCart />} 
                        label="Active" 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(list.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  {list.estimatedTotal && (
                    <Typography variant="body2" color="text.secondary">
                      Estimated Total: ${list.estimatedTotal.toFixed(2)}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions>
                  <Button size="small" onClick={() => handleViewList(list._id)}>
                    View List
                  </Button>
                  <Button size="small" onClick={() => handleEditList(list._id)}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/lists/new')}
      >
        <AddIcon />
      </Fab>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Grocery List</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedList?.name}"? This action cannot be undone.
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

export default GroceryLists;