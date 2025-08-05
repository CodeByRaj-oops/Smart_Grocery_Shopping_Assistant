import React, { useEffect } from 'react';
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
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ShoppingCart,
  Kitchen,
  Notifications,
  Restaurant,
  TrendingUp,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { getGroceryLists } from '../store/slices/groceryListsSlice';
import { getInventory } from '../store/slices/inventorySlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { groceryLists, isLoading: listsLoading } = useSelector((state) => state.groceryLists);
  const { inventory, isLoading: inventoryLoading } = useSelector((state) => state.inventory);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      dispatch(getGroceryLists());
      dispatch(getInventory());
    }
  }, [user, navigate, dispatch]);
  
  // Calculate low stock items
  const lowStockItems = inventory.filter(item => 
    item.currentStock <= item.minStockLevel
  );
  
  // Calculate expiring soon items (within 7 days)
  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });
  
  // Get active grocery lists
  const activeLists = groceryLists.filter(list => 
    !list.isCompleted
  );
  
  if (listsLoading || inventoryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name || 'Shopper'}!
      </Typography>
      
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate('/lists/new')}
                >
                  New List
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  fullWidth
                  startIcon={<Kitchen />}
                  onClick={() => navigate('/inventory/add')}
                >
                  Add to Inventory
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<Restaurant />}
                  onClick={() => navigate('/recipes')}
                >
                  Recipes
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<TrendingUp />}
                  onClick={() => navigate('/recommendations')}
                >
                  Recommendations
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Active Grocery Lists */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Active Grocery Lists
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {activeLists.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No active grocery lists. Create a new list to get started!
                </Typography>
              ) : (
                <List>
                  {activeLists.slice(0, 3).map((list) => (
                    <ListItem key={list._id}>
                      <ListItemIcon>
                        <ShoppingCart />
                      </ListItemIcon>
                      <ListItemText 
                        primary={list.name} 
                        secondary={`${list.items.length} items • Created ${new Date(list.createdAt).toLocaleDateString()}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/lists')}>
                View All Lists
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Inventory Alerts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                Inventory Alerts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {lowStockItems.length === 0 && expiringItems.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    No alerts. Your inventory is in good shape!
                  </Typography>
                </Box>
              ) : (
                <List>
                  {lowStockItems.slice(0, 3).map((item) => (
                    <ListItem key={item._id}>
                      <ListItemIcon>
                        <Warning color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Low Stock: ${item.name}`} 
                        secondary={`Current: ${item.currentStock} ${item.unit} (Min: ${item.minStockLevel} ${item.unit})`} 
                      />
                    </ListItem>
                  ))}
                  
                  {expiringItems.slice(0, 3).map((item) => (
                    <ListItem key={item._id}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Expiring Soon: ${item.name}`} 
                        secondary={`Expires on ${new Date(item.expiryDate).toLocaleDateString()}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/inventory')}>
                View Inventory
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;