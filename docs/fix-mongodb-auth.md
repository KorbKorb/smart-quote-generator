# MongoDB Atlas - Fix Authentication Error

## Quick Fix Steps:

### 1. Log into MongoDB Atlas
- Go to: https://cloud.mongodb.com
- Sign in with your account

### 2. Create a New Database User
- Click "Database Access" in the left sidebar
- Click "ADD NEW DATABASE USER"
- Fill in:
  - Authentication Method: Password
  - Username: `smartquoteapp`
  - Password: Click "Autogenerate Secure Password"
  - IMPORTANT: Copy this password immediately!
  - Database User Privileges: "Atlas Admin"
- Click "Add User"

### 3. Update Your Connection String
Your new connection string will be:
```
mongodb+srv://smartquoteapp:YOUR_NEW_PASSWORD@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### 4. Update Railway Environment Variable
- Go to Railway Dashboard: https://railway.app/dashboard
- Click your project
- Go to Variables tab
- Update MONGODB_URI with the new connection string

### 5. Also Check Network Access
While in MongoDB Atlas:
- Click "Network Access" in the left sidebar
- Make sure you have "0.0.0.0/0" (Allow access from anywhere)
- If not, click "ADD IP ADDRESS" → "ALLOW ACCESS FROM ANYWHERE"

## Alternative: Reset Existing User Password

If user "korbin" exists:
1. In Database Access, find the user "korbin"
2. Click "Edit" 
3. Click "Edit Password"
4. Generate new password
5. Update connection string everywhere

## Test Your New Connection String

After updating, test locally:
1. Update backend/.env with new MONGODB_URI
2. Run: npm start in backend folder
3. Should see "Connected to MongoDB" message