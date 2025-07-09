// MongoDB Connection Debugger
const { MongoClient } = require('mongodb');

console.log('🔍 MongoDB Connection Debugger\n');

// Your connection string from .env
const uri = 'mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Let's also try without the extra parameters
const uriBasic = 'mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/';

async function testConnection(connectionString, label) {
    console.log(`\nTesting ${label}...`);
    console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'));
    
    const client = new MongoClient(connectionString);
    
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // List databases
        const databasesList = await client.db().admin().listDatabases();
        console.log('Databases:');
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
        
        await client.close();
        return true;
    } catch (error) {
        console.log('❌ Connection failed!');
        console.log('Error:', error.message);
        if (error.message.includes('bad auth')) {
            console.log('\n⚠️  Authentication failed. Possible causes:');
            console.log('1. Wrong username or password');
            console.log('2. User not created in MongoDB Atlas');
            console.log('3. Password contains special characters that need URL encoding');
            console.log('4. Database user lacks permissions');
        }
        return false;
    }
}

async function runTests() {
    console.log('Testing MongoDB connections...\n');
    
    // Test original connection
    await testConnection(uri, 'Full Connection String');
    
    // Test basic connection
    await testConnection(uriBasic, 'Basic Connection String');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Log into MongoDB Atlas: https://cloud.mongodb.com');
    console.log('2. Go to Database Access (left sidebar)');
    console.log('3. Check if user "korbin" exists');
    console.log('4. If not, create a new database user');
    console.log('5. Make sure to copy the password exactly');
    console.log('6. Update the connection string in Railway');
    
    console.log('\n🔐 To create a new MongoDB user:');
    console.log('1. Database Access → Add New Database User');
    console.log('2. Username: korbin_app (or any name)');
    console.log('3. Password: Generate a secure password (no special chars)');
    console.log('4. Built-in Role: Atlas Admin');
    console.log('5. Add User');
    
    console.log('\n🔗 New connection string format:');
    console.log('mongodb+srv://USERNAME:PASSWORD@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority');
}

runTests().catch(console.error);