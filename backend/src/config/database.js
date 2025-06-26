const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection string
    // For local MongoDB: mongodb://localhost:27017/smart-quote-generator
    // For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/smart-quote-generator
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/smart-quote-generator';

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional options for production
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(mongoUri, options);

    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
