import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider, useDispatch } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';

// Theme and Store
import theme from './theme';
import store from './store';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import GroceryLists from './pages/GroceryLists';
import GroceryListDetail from './pages/GroceryListDetail';
import GroceryListForm from './components/grocery/GroceryListForm';
import Inventory from './pages/Inventory';
import InventoryItemForm from './components/inventory/InventoryItemForm';

// Default user component
const DefaultUser = ({ children }) => {
  useEffect(() => {
    // Always create a default user
    const defaultUser = {
      id: '1',
      name: 'Default User',
      email: 'user@example.com',
      token: 'default-token',
      refreshToken: 'default-refresh-token'
    };
    localStorage.setItem('user', JSON.stringify(defaultUser));
  }, []);
  
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <DefaultUser>
            <Routes>
              <Route path="/" element={
                <Layout>
                  <Home />
                </Layout>
              } />
              <Route path="/lists" element={
                <Layout>
                  <GroceryLists />
                </Layout>
              } />
              <Route path="/lists/:id" element={
                <Layout>
                  <GroceryListDetail />
                </Layout>
              } />
              <Route path="/lists/new" element={
                <Layout>
                  <GroceryListForm />
                </Layout>
              } />
              <Route path="/test-auth" element={
                <Layout>
                  <TestAuth />
                </Layout>
              } />
              <Route path="/lists/edit/:id" element={
                <Layout>
                  <GroceryListForm />
                </Layout>
              } />
              <Route path="/inventory" element={
                <Layout>
                  <Inventory />
                </Layout>
              } />
              <Route path="/inventory/new" element={
                <Layout>
                  <InventoryItemForm />
                </Layout>
              } />
              <Route path="/inventory/edit/:id" element={
                <Layout>
                  <InventoryItemForm />
                </Layout>
              } />
            </Routes>
          </AutoLogin>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
