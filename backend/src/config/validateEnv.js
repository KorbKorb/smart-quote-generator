// Environment configuration validation
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

const validateEnv = () => {
  console.log('🔍 Validating environment configuration...');
  
  // Check for missing variables
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  // Security validations
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    console.error('Run: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
  }
  
  // Check for default/exposed credentials
  const exposedPatterns = [
    '7TVPNDteXClUVP2b', // Your current exposed password
    'your-jwt-secret',
    'your-mongodb-connection',
    'password123',
    'secret'
  ];
  
  const hasExposedCredentials = exposedPatterns.some(pattern => 
    process.env.MONGODB_URI?.includes(pattern) || 
    process.env.JWT_SECRET?.includes(pattern)
  );
  
  if (hasExposedCredentials) {
    console.error('❌ SECURITY WARNING: Exposed or default credentials detected!');
    console.error('Please update your credentials immediately.');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot start in production with exposed credentials');
      process.exit(1);
    } else {
      console.warn('⚠️  Running in development with exposed credentials - DO NOT DEPLOY');
    }
  }
  
  // Validate MongoDB URI format
  if (!process.env.MONGODB_URI.match(/^mongodb(\+srv)?:\/\/.+/)) {
    console.error('❌ Invalid MONGODB_URI format');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
};

module.exports = validateEnv;