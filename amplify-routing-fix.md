# AWS Amplify - Fix Customer Portal Routing

## Quick Fix in AWS Console:

1. **Go to AWS Amplify Console**
   - https://console.aws.amazon.com/amplify
   - Click on your app (main.dtpbc2f4zygku)

2. **Navigate to Rewrites and Redirects**
   - In the left menu, find "Rewrites and redirects"
   - Click on it

3. **Delete Any Existing Rules** (if any)

4. **Add New Rewrite Rule**
   Click "Add rule" and enter:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`
   
5. **Save**

## Alternative Simple Rule:
If the above regex doesn't work, try this simpler version:
   - Source: `/<*>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

## This Will Fix:
- Direct access to /customer-portal
- Direct access to any React Router route
- Browser refresh on any page

## Test After Saving:
- https://main.dtpbc2f4zygku.amplifyapp.com/customer-portal (direct access)
- Navigate to customer portal and refresh the page