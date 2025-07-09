# Site Breadcrumbs & Pine Green UI Theme Implementation

## Project Overview
We need to implement breadcrumb navigation across the Smart Quote Generator application and update the entire UI color scheme to use Pine Green (#1A4D46) as the primary color with complementary colors.

## Current Site Structure

### Admin Panel Routes
- `/admin` - Dashboard
- `/admin/new-quote` - Create New Quote
- `/admin/quotes` - Quote History/List
- `/admin/quotes/:id` - Quote Detail View

### Customer Portal Routes
- `/portal/login` - Customer Login
- `/portal/register` - Customer Registration
- `/portal/registration-success` - Registration Success
- `/portal/dashboard` - Customer Dashboard
- `/portal/quotes` - Customer Quote List (to be implemented)
- `/portal/quotes/:id` - Customer Quote Detail (to be implemented)
- `/portal/orders` - Order History (to be implemented)
- `/portal/account` - Account Settings (to be implemented)

## Breadcrumb Requirements

### 1. Breadcrumb Component Features
- Show current location in site hierarchy
- Clickable links to parent pages
- Responsive design (collapse on mobile)
- Icons for each level (optional)
- Current page should not be clickable
- Separator between levels (>, /, or custom icon)

### 2. Breadcrumb Examples

**Admin Panel:**
- Dashboard: `Home`
- New Quote: `Home > New Quote`
- Quote List: `Home > Quotes`
- Quote Detail: `Home > Quotes > Quote #Q202401001`

**Customer Portal:**
- Dashboard: `Portal > Dashboard`
- Quote List: `Portal > Dashboard > My Quotes`
- Quote Detail: `Portal > Dashboard > My Quotes > Quote #Q202401001`
- Account: `Portal > Dashboard > Account Settings`

### 3. Dynamic Breadcrumbs
- Quote details should show quote number
- User-specific pages should show user name where appropriate
- Date-based filtering should be reflected

## Pine Green Color Scheme

### Primary Colors
```css
--pine-green-primary: #1A4D46;      /* Main Pine Green */
--pine-green-dark: #0F2E2A;         /* Darker variant */
--pine-green-light: #2A6D64;        /* Lighter variant */
--pine-green-pale: #E8F0EF;         /* Very light tint for backgrounds */
```

### Complementary Colors
```css
/* Warm Accent - Terracotta/Coral */
--accent-warm: #D97559;             /* Calls-to-action, important buttons */
--accent-warm-light: #E8A593;       /* Hover states */
--accent-warm-pale: #FAF0ED;        /* Light backgrounds */

/* Cool Accent - Sky Blue */
--accent-cool: #6FA3A0;             /* Secondary actions, info */
--accent-cool-light: #9FC4C2;       /* Hover states */
--accent-cool-pale: #EFF6F6;        /* Light backgrounds */

/* Neutral Colors */
--neutral-900: #1A1A1A;             /* Text */
--neutral-800: #2D2D2D;             /* Headings */
--neutral-700: #404040;             /* Secondary text */
--neutral-600: #595959;             /* Muted text */
--neutral-500: #737373;             /* Borders */
--neutral-400: #A6A6A6;             /* Disabled */
--neutral-300: #D9D9D9;             /* Light borders */
--neutral-200: #E6E6E6;             /* Backgrounds */
--neutral-100: #F5F5F5;             /* Light backgrounds */
--neutral-50: #FAFAFA;              /* Very light backgrounds */
--white: #FFFFFF;                   /* Pure white */

/* Semantic Colors */
--success: #2E7D32;                 /* Success, approved */
--warning: #ED6C02;                 /* Warning, pending */
--error: #D32F2F;                   /* Error, rejected */
--info: #0288D1;                    /* Information */
```

### Color Usage Guidelines

1. **Primary Actions**: Pine Green (#1A4D46)
   - Primary buttons
   - Active navigation items
   - Important links
   - Brand elements

2. **Secondary Actions**: Cool Accent (#6FA3A0)
   - Secondary buttons
   - Info badges
   - Less important links

3. **Call-to-Action**: Warm Accent (#D97559)
   - CTA buttons
   - Important notifications
   - Promotional elements

4. **Backgrounds**:
   - Main background: #FAFAFA or #FFFFFF
   - Section backgrounds: #F5F5F5
   - Card backgrounds: #FFFFFF with subtle shadows
   - Hover states: Pine Green Pale (#E8F0EF)

5. **Text**:
   - Primary text: #1A1A1A
   - Secondary text: #404040
   - Muted text: #737373
   - Links: Pine Green (#1A4D46)

## Implementation Tasks

### Phase 1: Breadcrumb Component
1. Create a reusable `Breadcrumbs` component
2. Implement route-based breadcrumb generation
3. Add breadcrumbs to all pages
4. Style breadcrumbs with Pine Green theme
5. Make responsive for mobile

### Phase 2: Color Theme Update
1. Create new CSS variables file with Pine Green theme
2. Update all existing components to use new colors
3. Update buttons, forms, and inputs
4. Update navigation and headers
5. Update cards and modals
6. Update tables and data displays
7. Update status badges and alerts

### Phase 3: Typography & Spacing
1. Ensure serif/sans-serif fonts work with new colors
2. Adjust font weights for better contrast
3. Update spacing for better visual hierarchy
4. Add subtle animations/transitions

### Phase 4: Component Updates
1. Update admin dashboard with new colors
2. Update customer portal with new colors
3. Update quote forms and displays
4. Update all icons to match theme
5. Create dark mode variant (optional)

## Breadcrumb Component Structure

```jsx
// Example breadcrumb data structure
const breadcrumbs = [
  { label: 'Home', path: '/admin', icon: 'home' },
  { label: 'Quotes', path: '/admin/quotes', icon: 'document' },
  { label: 'Quote #Q202401001', path: null, icon: null } // Current page
];

// Component usage
<Breadcrumbs items={breadcrumbs} separator=">" />
```

## Visual Design Specifications

### Breadcrumb Styling
- Height: 40px
- Background: White with subtle bottom border
- Text color: #737373 for links, #1A4D46 for current page
- Hover: Pine Green (#1A4D46) with underline
- Separator: #D9D9D9
- Font size: 14px
- Padding: 16px horizontal

### Button Styles
- Primary: Background #1A4D46, text white, hover #0F2E2A
- Secondary: Background #6FA3A0, text white, hover #5A8A87
- CTA: Background #D97559, text white, hover #C4614D
- Ghost: Border #1A4D46, text #1A4D46, hover background #E8F0EF

### Form Elements
- Input borders: #D9D9D9, focus #1A4D46
- Input background: #FFFFFF
- Label color: #404040
- Error color: #D32F2F
- Success color: #2E7D32

## Mobile Considerations
- Breadcrumbs should show only current and parent on mobile
- Use "..." for intermediate levels
- Consider swipe gestures for navigation
- Ensure touch targets are at least 44px

## Accessibility
- Ensure color contrast ratios meet WCAG AA standards
- Add aria-labels to breadcrumb navigation
- Include keyboard navigation support
- Test with screen readers

Would you like me to start implementing these changes? I can begin with either the breadcrumb component or the color theme update.