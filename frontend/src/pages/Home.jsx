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
    // Only dispatch actions if user exists and is not the default user
    if (user && user.id !== '1') {
      dispatch(getGroceryLists());
      dispatch(getInventory());
    }
  }, [user, dispatch]);
  
  // Calculate low stock items
  const lowStockItems = inventory.items ? inventory.items.filter(item => 
    item.quantity <= item.lowStockThreshold
  ) : [];
  
  // Calculate expiring soon items (within 7 days)
  const expiringSoonItems = inventory.items ? inventory.items.filter(item => {
    if (!item.expirationDate) return false;
    const today = new Date();
    const expirationDate = new Date(item.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  }) : [];
  
  // Get active grocery lists
  const activeLists = groceryLists.filter(list => list.status !== 'completed');
  
  if (listsLoading || inventoryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Check if user is the default user (not authenticated)
  const isDefaultUser = user && user.id === '1';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to ShopSmartly!
      </Typography>
      
      {isDefaultUser ? (
        // Content for non-authenticated users
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Smart Grocery Shopping Assistant
              </Typography>
              <Typography paragraph>
                Manage your grocery lists, track your household inventory, and get personalized recommendations.
              </Typography>
              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="primary"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Content for authenticated users
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ShoppingCart />}
                    onClick={() => navigate('/lists/new')}
                    sx={{ height: '100%' }}
                  >
                    New List
                  </Button>
                </Grid>
              <Grid item xs={6} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Kitchen />}
                  onClick={() => navigate('/inventory/new')}
                  sx={{ height: '100%' }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Active Grocery Lists */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Active Grocery Lists
              </Typography>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate('/lists')}
              >
                View All
              </Button>
            </Box>
            
            {activeLists.length > 0 ? (
              <Grid container spacing={2}>
                {activeLists.slice(0, 3).map((list) => (
                  <Grid item xs={12} sm={6} md={4} key={list._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h2">
                          {list.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {list.items.length} items
                        </Typography>
                        {list.householdId && (
                          <Typography variant="body2" color="text.secondary">
                            Household: {list.householdId.name}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => navigate(`/lists/${list._id}`)}
                        >
                          View
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1">
                  No active grocery lists.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate('/lists/new')}
                  sx={{ mt: 2 }}
                >
                  Create New List
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Inventory Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Inventory Alerts
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
              <Warning color="warning" sx={{ mr: 1 }} />
              Low Stock Items
            </Typography>
            
            {lowStockItems.length > 0 ? (
              <List dense>
                {lowStockItems.slice(0, 5).map((item) => (
                  <ListItem key={item._id}>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.quantity} ${item.unit} remaining`}
                    />
                  </ListItem>
                ))}
                {lowStockItems.length > 5 && (
                  <ListItem>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/inventory?filter=lowStock')}
                    >
                      View {lowStockItems.length - 5} more
                    </Button>
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography variant="body2" sx={{ ml: 4, my: 2 }}>
                No low stock items.
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Notifications color="error" sx={{ mr: 1 }} />
              Expiring Soon
            </Typography>
            
            {expiringSoonItems.length > 0 ? (
              <List dense>
                {expiringSoonItems.slice(0, 5).map((item) => {
                  const expirationDate = new Date(item.expirationDate);
                  const today = new Date();
                  const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <ListItem key={item._id}>
                      <ListItemIcon>
                        <Notifications color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={`Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`}
                      />
                    </ListItem>
                  );
                })}
                {expiringSoonItems.length > 5 && (
                  <ListItem>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/inventory?filter=expiringSoon')}
                    >
                      View {expiringSoonItems.length - 5} more
                    </Button>
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography variant="body2" sx={{ ml: 4, my: 2 }}>
                No items expiring soon.
              </Typography>
            )}
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/inventory')}
              sx={{ mt: 2 }}
            >
              Manage Inventory
            </Button>
          </Paper>
        </Grid>
      </Grid>
      )}
    </Box>
  );
};

export default Home;