const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define validation schema
const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(5000),
  API_VERSION: Joi.string().default('v1'),
  
  // Database
  MONGODB_URI: Joi.string().required()
    .description('MongoDB connection string'),
  
  // AWS
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET_NAME: Joi.string().required(),
  
  // Cognito
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
  
  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  SESSION_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().integer().positive().default(10485760),
  ALLOWED_FILE_TYPES: Joi.string().default('.dxf,.dwg,.pdf'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(100),
}).unknown(); // Allow unknown keys for flexibility

// Validate environment variables
const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export validated and typed configuration
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,
  
  database: {
    uri: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }
  },
  
  aws: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucketName: envVars.AWS_S3_BUCKET_NAME,
    }
  },
  
  cognito: {
    userPoolId: envVars.COGNITO_USER_POOL_ID,
    clientId: envVars.COGNITO_CLIENT_ID,
    region: envVars.COGNITO_REGION || envVars.AWS_REGION,
  },
  
  security: {
    jwtSecret: envVars.JWT_SECRET,
    sessionSecret: envVars.SESSION_SECRET,
    encryptionKey: envVars.ENCRYPTION_KEY,
    bcryptRounds: 10,
  },
  
  fileUpload: {
    maxSize: envVars.MAX_FILE_SIZE,
    allowedTypes: envVars.ALLOWED_FILE_TYPES.split(','),
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  }
};