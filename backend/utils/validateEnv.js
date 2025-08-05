const validateEnv = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'REFRESH_TOKEN_EXPIRE',
    'FRONTEND_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`.red.bold);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot start in production mode with missing environment variables'.red.bold);
      process.exit(1);
    } else {
      console.warn('Running in development mode with missing environment variables'.yellow.bold);
      console.warn('Some features may not work correctly'.yellow);
    }
  }

  // Validate JWT expiry format
  const jwtExpireRegex = /^\d+[smhd]$/; // e.g., 15m, 1h, 7d
  if (process.env.JWT_EXPIRE && !jwtExpireRegex.test(process.env.JWT_EXPIRE)) {
    console.error(`Invalid JWT_EXPIRE format: ${process.env.JWT_EXPIRE}. Should be like '15m', '1h', '7d'`.red.bold);
  }

  if (process.env.REFRESH_TOKEN_EXPIRE && !jwtExpireRegex.test(process.env.REFRESH_TOKEN_EXPIRE)) {
    console.error(`Invalid REFRESH_TOKEN_EXPIRE format: ${process.env.REFRESH_TOKEN_EXPIRE}. Should be like '30d'`.red.bold);
  }
};

module.exports = validateEnv;