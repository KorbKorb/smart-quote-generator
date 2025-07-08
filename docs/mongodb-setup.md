# MongoDB Atlas IP Whitelist Instructions

## Steps to Update IP Whitelist:

1. **Log into MongoDB Atlas**
   - Go to: https://cloud.mongodb.com
   - Sign in with your credentials

2. **Navigate to Network Access**
   - Click on your cluster (Cluster0)
   - Go to "Network Access" in the left sidebar

3. **Add Railway IPs**
   - Click "Add IP Address"
   - For now, you can temporarily use "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: This is okay for testing, but you should restrict it later

4. **For Production Security**
   - Railway provides static IPs for paid plans
   - Or use MongoDB Atlas PrivateLink for enhanced security
   - Consider using connection string with SRV records

## Alternative: Use Environment Variables in Railway

Instead of IP whitelisting, you can:
1. Go to Railway dashboard
2. Add environment variable: `MONGODB_URI`
3. Use your full connection string
4. Railway handles the connection securely

## Testing the Connection

After deployment, check Railway logs:
- Look for "Connected to MongoDB" message
- Check for any connection errors
- Monitor response times