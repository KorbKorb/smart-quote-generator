const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

console.log('Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('\n✓ Successfully connected to MongoDB!');
    console.log('Database name:', mongoose.connection.name);
    
    // List collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('\nCollections in database:');
        collections.forEach(col => console.log(' -', col.name));
      }
      
      // Close connection
      mongoose.connection.close();
    });
  })
  .catch(err => {
    console.error('\n✗ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
