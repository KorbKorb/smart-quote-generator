// Test MongoDB Connection with New Password
const { MongoClient } = require('mongodb');

const newUri = 'mongodb+srv://korbin:7TVPNDteXClUVP2b@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔍 Testing MongoDB connection with new password...\n');

async function testNewConnection() {
    const client = new MongoClient(newUri);
    
    try {
        await client.connect();
        console.log('✅ SUCCESS! Connected to MongoDB with new password!');
        
        // Test database access
        const db = client.db('test');
        const collections = await db.listCollections().toArray();
        console.log('\n📊 Database connection verified');
        console.log('Number of collections:', collections.length);
        
        await client.close();
        
        console.log('\n🎉 MongoDB authentication is now working!');
        console.log('\n⚡ Next steps:');
        console.log('1. Make sure you updated Railway environment variable');
        console.log('2. Wait for Railway to redeploy (2-3 minutes)');
        console.log('3. Check Railway logs for "Connected to MongoDB"');
        console.log('4. Your app should now be fully functional!');
        
    } catch (error) {
        console.log('❌ Connection failed!');
        console.log('Error:', error.message);
        console.log('\nPlease double-check:');
        console.log('1. Password is correct: 7TVPNDteXClUVP2b');
        console.log('2. User "korbin" exists in MongoDB Atlas');
        console.log('3. Network Access allows 0.0.0.0/0');
    }
}

testNewConnection();