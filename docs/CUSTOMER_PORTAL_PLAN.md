# Customer Portal Implementation Plan

## Overview

The Customer Portal will provide a self-service interface where customers can:

- View and manage their quotes
- Accept or reject quotes online
- Track order history
- Upload files for new quotes
- Download invoices and documents
- Manage their account information

## Architecture

### Frontend Routes

```
/portal                    - Portal login page
/portal/dashboard          - Customer dashboard
/portal/quotes             - View all quotes
/portal/quotes/:id         - Individual quote details
/portal/quotes/:id/accept  - Accept quote page
/portal/orders             - Order history
/portal/account            - Account settings
/portal/new-request        - Request new quote
```

### Backend Routes

```
/api/auth/customer/register     - Customer registration
/api/auth/customer/login        - Customer login
/api/auth/customer/logout       - Customer logout
/api/auth/customer/forgot       - Password reset
/api/customer/profile           - Get/update profile
/api/customer/quotes            - Get customer's quotes
/api/customer/quotes/:id        - Get specific quote
/api/customer/quotes/:id/accept - Accept quote
/api/customer/quotes/:id/reject - Reject quote
/api/customer/upload            - Upload files for quote
```

## Features to Implement

### Phase 1: Authentication & Basic Portal (Days 1-2)

1. **Customer Model**

   - Email/password authentication
   - Profile information
   - Company details
   - Contact preferences

2. **Authentication System**

   - JWT-based auth
   - Secure login/logout
   - Password reset via email
   - Remember me option

3. **Portal Layout**
   - Responsive design
   - Customer-specific navigation
   - Branded header
   - Mobile-friendly

### Phase 2: Quote Management (Days 2-3)

1. **Quote Dashboard**

   - List all quotes
   - Filter by status
   - Search functionality
   - Sort options

2. **Quote Details**

   - View full quote information
   - Download PDF
   - View 3D part preview
   - Price breakdown

3. **Quote Actions**
   - Accept quote online
   - Reject with reason
   - Request modifications
   - Add notes

### Phase 3: Self-Service Features (Days 3-4)

1. **New Quote Request**

   - Upload DXF files
   - Specify requirements
   - Save draft requests
   - Track request status

2. **Order History**

   - View accepted quotes
   - Reorder previous parts
   - Download invoices
   - Track deliveries

3. **Document Center**
   - All PDFs in one place
   - Certificates
   - Invoices
   - Technical drawings

### Phase 4: Enhanced Features (Days 4-5)

1. **Account Management**

   - Update profile
   - Change password
   - Notification preferences
   - Billing addresses

2. **Communication**

   - Message history
   - Quote comments
   - Support tickets
   - Notifications

3. **Analytics**
   - Spending overview
   - Order trends
   - Favorite materials
   - Quote statistics

## Technical Stack

### Frontend

- React with React Router
- Separate auth context for customers
- Protected routes
- Tailwind CSS for styling
- Recharts for analytics

### Backend

- Express middleware for customer auth
- Separate JWT secret for customers
- Role-based access control
- Customer-specific API endpoints

### Database

- Customer model with auth fields
- Relationship to quotes
- Activity logging
- Preferences storage

## Security Considerations

- Separate auth system from admin
- Rate limiting on auth endpoints
- Email verification
- Secure password requirements
- Session management
- CORS configuration

## UI/UX Design

- Clean, professional interface
- Company branding options
- Mobile-first approach
- Intuitive navigation
- Quick actions
- Help tooltips

## Implementation Order

1. Customer model and auth
2. Portal layout and routing
3. Quote viewing functionality
4. Quote actions (accept/reject)
5. New quote requests
6. Order history
7. Account management
8. Analytics and reporting
