const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    // Log the MongoDB URI being used (without sensitive credentials)
    console.log(`Attempting to connect to MongoDB...`.yellow);
    
    if (!process.env.MONGO_URI) {
      console.error(`MongoDB URI is not defined in environment variables`.red.bold);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.log(`Using default local MongoDB URI in development mode`.yellow);
      }
    }
    
    // Set mongoose options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    };
    
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grocery-assistant', options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    console.log(`Make sure MongoDB is running on your system or update the MONGO_URI in your .env file`.yellow);
    
    // Don't exit the process in development mode to allow for troubleshooting
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log(`Application continuing without database connection. Some features may not work.`.yellow);
    }
    
    return null;
  }
};

module.exports = connectDB;