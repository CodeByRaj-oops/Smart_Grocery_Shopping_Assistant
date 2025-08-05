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
              Smart Grocery Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Making grocery shopping smarter and more efficient.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block">Home</Link>
            <Link href="/lists" color="inherit" display="block">Grocery Lists</Link>
            <Link href="/inventory" color="inherit" display="block">Inventory</Link>
            <Link href="/recipes" color="inherit" display="block">Recipes</Link>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Help & Support
            </Typography>
            <Link href="/faq" color="inherit" display="block">FAQ</Link>
            <Link href="/contact" color="inherit" display="block">Contact Us</Link>
            <Link href="/privacy" color="inherit" display="block">Privacy Policy</Link>
            <Link href="/terms" color="inherit" display="block">Terms of Service</Link>
          </Grid>
        </Grid>
        
        <Box mt={5}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Smart Grocery Shopping Assistant. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;