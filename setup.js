const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Check if MongoDB is running
const checkMongoDB = () => {
  log.info('Checking MongoDB connection...');
  try {
    // Simple check - this will throw an error if MongoDB is not running
    execSync('mongosh --eval "db.version()" --quiet', { stdio: 'pipe' });
    log.success('MongoDB is running!');
    return true;
  } catch (error) {
    log.warning('MongoDB is not running or not installed.');
    log.info('Please make sure MongoDB is installed and running before starting the application.');
    return false;
  }
};

// Install dependencies
const installDependencies = () => {
  log.title('Installing dependencies');
  
  // Install backend dependencies
  log.info('Installing backend dependencies...');
  try {
    execSync('cd backend && npm install', { stdio: 'inherit' });
    log.success('Backend dependencies installed successfully!');
  } catch (error) {
    log.error('Failed to install backend dependencies.');
    throw error;
  }
  
  // Install frontend dependencies
  log.info('Installing frontend dependencies...');
  try {
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    log.success('Frontend dependencies installed successfully!');
  } catch (error) {
    log.error('Failed to install frontend dependencies.');
    throw error;
  }
};

// Check and create .env file if it doesn't exist
const setupEnvFiles = () => {
  log.title('Setting up environment files');
  
  // Backend .env file
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(backendEnvPath)) {
    log.info('Creating backend .env file...');
    const backendEnvContent = `NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/grocery-assistant
JWT_SECRET=44cc63fbea239c024fdf504fda4216be13f6ed3f521113d9c7cbc0d22b5c8d55ea6642ab3b25b831e64c71a462991a4a0d1d29d19f788edcd19deef468b37f5d
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
`;
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    log.success('Backend .env file created successfully!');
  } else {
    log.info('Backend .env file already exists.');
  }
  
  // Frontend .env file
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  if (!fs.existsSync(frontendEnvPath)) {
    log.info('Creating frontend .env file...');
    const frontendEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
`;
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    log.success('Frontend .env file created successfully!');
  } else {
    log.info('Frontend .env file already exists.');
  }
};

// Start the application
const startApplication = () => {
  log.title('Starting the application');
  
  log.info('You can start the application with the following commands:');
  log.info('\nBackend:');
  log.info('cd backend && npm run dev');
  
  log.info('\nFrontend:');
  log.info('cd frontend && npm start');
  
  rl.question('\nDo you want to start the application now? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      log.info('Starting the backend and frontend...');
      try {
        // Start backend in a new terminal
        const startBackendCmd = process.platform === 'win32' 
          ? 'start cmd /k "cd backend && npm run dev"'
          : 'osascript -e \'tell app "Terminal" to do script "cd \"' + __dirname + '/backend\" && npm run dev"\'';
        
        execSync(startBackendCmd, { stdio: 'ignore' });
        log.success('Backend started successfully!');
        
        // Start frontend in a new terminal
        const startFrontendCmd = process.platform === 'win32'
          ? 'start cmd /k "cd frontend && npm start"'
          : 'osascript -e \'tell app "Terminal" to do script "cd \"' + __dirname + '/frontend\" && npm start"\'';
        
        execSync(startFrontendCmd, { stdio: 'ignore' });
        log.success('Frontend started successfully!');
        
        log.info('\nApplication is now running:');
        log.info('- Backend: http://localhost:5000');
        log.info('- Frontend: http://localhost:3000');
      } catch (error) {
        log.error('Failed to start the application.');
        log.error(error.message);
      }
    }
    
    rl.close();
  });
};

// Main function
const main = async () => {
  log.title('Smart Grocery Shopping Assistant - Setup');
  
  try {
    // Check MongoDB
    checkMongoDB();
    
    // Install dependencies
    installDependencies();
    
    // Setup environment files
    setupEnvFiles();
    
    // Start application
    startApplication();
  } catch (error) {
    log.error('Setup failed:');
    log.error(error.message);
    process.exit(1);
  }
};

// Run the main function
main();