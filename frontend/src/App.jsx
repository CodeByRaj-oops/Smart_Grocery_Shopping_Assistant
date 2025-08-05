import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
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

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthTest from './components/auth/AuthTest';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Home />
              </Layout>
            } />
            <Route path="/lists" element={
              <Layout>
                <ProtectedRoute>
                  <GroceryLists />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/lists/:id" element={
              <Layout>
                <ProtectedRoute>
                  <GroceryListDetail />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/lists/new" element={
              <Layout>
                <ProtectedRoute>
                  <GroceryListForm />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/login" element={
              <Layout>
                <Login />
              </Layout>
            } />
            <Route path="/register" element={
              <Layout>
                <Register />
              </Layout>
            } />
            <Route path="/auth-test" element={
              <Layout>
                <AuthTest />
              </Layout>
            } />
            <Route path="/lists/edit/:id" element={
              <Layout>
                <ProtectedRoute>
                  <GroceryListForm />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/inventory" element={
              <Layout>
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/inventory/new" element={
              <Layout>
                <ProtectedRoute>
                  <InventoryItemForm />
                </ProtectedRoute>
              </Layout>
            } />
            <Route path="/inventory/edit/:id" element={
              <Layout>
                <ProtectedRoute>
                  <InventoryItemForm />
                </ProtectedRoute>
              </Layout>
            } />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
