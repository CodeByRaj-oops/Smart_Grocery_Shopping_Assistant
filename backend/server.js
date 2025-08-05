const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const path = require('path'); // Add path module
const mongoose = require('mongoose');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

// Add at the top after dotenv.config();
const validateEnv = require('./utils/validateEnv');

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Connect to database
(async () => {
  try {
    const conn = await connectDB();
    if (!conn && process.env.NODE_ENV === 'development') {
      console.log('Server starting without database connection in development mode'.yellow.bold);
    }
  } catch (error) {
    console.error(`Server initialization error: ${error.message}`.red.bold);
  }
})();

const app = express();

// Middleware
// Configure CORS properly
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/lists', require('./routes/groceryListRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  // Check MongoDB connection status
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = 'disconnected';
  
  switch(dbStatus) {
    case 0: dbStatusText = 'disconnected'; break;
    case 1: dbStatusText = 'connected'; break;
    case 2: dbStatusText = 'connecting'; break;
    case 3: dbStatusText = 'disconnecting'; break;
    default: dbStatusText = 'unknown';
  }
  
  const health = {
    status: dbStatus === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatusText,
      redis: process.env.REDIS_URI ? 'configured' : 'not configured',
      external_apis: process.env.BARCODE_API_KEY ? 'configured' : 'not configured'
    },
    version: process.env.APP_VERSION || '1.0.0'
  };
  
  // Return 200 even if some services are degraded
  res.status(200).json(health);
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// Error handler middleware
app.use(errorHandler);

// Change the default port from 5000 to another port (e.g., 5001)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});