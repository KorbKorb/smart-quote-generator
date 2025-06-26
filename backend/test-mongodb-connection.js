// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing MongoDB Atlas connection...');
  console.log(
    'Connection string:',
    process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@')
  );

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database name:', mongoose.connection.name);

    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: Date,
    });

    const TestModel = mongoose.model('Test', TestSchema);

    const testDoc = new TestModel({
      message: 'Connection test successful!',
      timestamp: new Date(),
    });

    await testDoc.save();
    console.log('✅ Successfully created test document');

    // Clean up
    await TestModel.deleteMany({});
    console.log('✅ Cleaned up test data');

    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);

    // Common error troubleshooting
    if (error.message.includes('Authentication failed')) {
      console.error('\n🔧 Authentication Error - Check:');
      console.error('1. Username and password in your connection string');
      console.error('2. User exists in Database Access section');
      console.error(
        "3. Password doesn't contain special characters that need encoding"
      );
    } else if (error.message.includes('connect ETIMEDOUT')) {
      console.error('\n🔧 Network Error - Check:');
      console.error('1. Your IP is whitelisted in Network Access');
      console.error('2. You have internet connection');
      console.error('3. No firewall blocking the connection');
    } else if (error.message.includes('queryTxt ETIMEOUT')) {
      console.error('\n🔧 DNS Error - Check:');
      console.error(
        '1. The cluster hostname in your connection string is correct'
      );
      console.error('2. Try using a different DNS server (e.g., 8.8.8.8)');
    }

    process.exit(1);
  }
}

testConnection();
