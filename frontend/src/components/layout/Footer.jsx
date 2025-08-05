import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              ShopSmartly
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Making grocery shopping smarter and more efficient.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Features
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <Link href="/lists" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                Smart Grocery Lists
              </Link>
              <Link href="/inventory" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                Household Inventory
              </Link>
              <Link href="/recipes" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                Recipe Suggestions
              </Link>
              <Link href="/shopping" color="inherit" underline="hover" display="block">
                Shopping Optimization
              </Link>
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Support
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <Link href="/help" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                Help Center
              </Link>
              <Link href="/faq" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                FAQ
              </Link>
              <Link href="/contact" color="inherit" underline="hover" display="block">
                Contact Us
              </Link>
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} ShopSmartly. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;