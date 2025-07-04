# Breadcrumb Component Documentation

## Overview
The breadcrumb component provides hierarchical navigation for both the admin panel and customer portal, automatically generating breadcrumbs based on the current route.

## Features
- **Automatic Generation**: Breadcrumbs are automatically generated from the current URL path
- **Custom Breadcrumbs**: Support for custom breadcrumb items when needed
- **Responsive Design**: Collapses intelligently on mobile devices
- **Icon Support**: Optional icons for each breadcrumb level
- **Dynamic Routes**: Handles dynamic segments like quote IDs
- **Accessibility**: Full ARIA support for screen readers

## Usage

### Basic Usage (Automatic)
The breadcrumb component automatically generates breadcrumbs based on the current route:

```jsx
import Breadcrumbs from './components/Breadcrumbs';

// In your component or layout
<Breadcrumbs />
```

### Custom Breadcrumbs
You can override the automatic generation with custom items:

```jsx
const customBreadcrumbs = [
  { label: 'Home', path: '/admin', icon: '🏠' },
  { label: 'Quotes', path: '/admin/quotes', icon: '📋' },
  { label: 'Quote #Q202401001', path: null, icon: '📄', current: true }
];

<Breadcrumbs customItems={customBreadcrumbs} />
```

### With Dynamic Data
For pages with dynamic data (like quote details):

```jsx
// In QuoteDetail.jsx
const [quote, setQuote] = useState(null);

const breadcrumbItems = quote ? [
  { label: 'Home', path: '/admin', icon: '🏠' },
  { label: 'Quotes', path: '/admin/quotes', icon: '📋' },
  { label: `Quote #${quote.quoteNumber}`, current: true }
] : null;

return (
  <>
    {breadcrumbItems && <Breadcrumbs customItems={breadcrumbItems} />}
    {/* Rest of your component */}
  </>
);
```

## Route Configuration

The component has built-in configurations for common routes:

### Admin Routes
- `/admin` → Dashboard 🏠
- `/admin/new-quote` → New Quote 📝
- `/admin/quotes` → Quotes 📋
- `/admin/quotes/:id` → Quote #XXXXXX

### Customer Portal Routes
- `/portal` → Portal 🏢
- `/portal/dashboard` → Dashboard 📊
- `/portal/quotes` → My Quotes 📋
- `/portal/orders` → Orders 📦
- `/portal/account` → Account Settings ⚙️

## Mobile Behavior

On mobile devices (< 640px):
- Shows only the first and last two breadcrumb items
- Displays "..." for hidden middle items
- Maintains full functionality with touch-friendly tap targets

## Customization

### Adding New Routes
To add breadcrumb support for new routes, update the `routeConfig` object in `Breadcrumbs.jsx`:

```jsx
const routeConfig = {
  // ... existing routes
  'new-route': {
    label: 'New Feature',
    icon: '✨',
  },
};
```

### Styling
The component uses CSS classes that can be customized:
- `.breadcrumbs` - Main container
- `.breadcrumb-link` - Clickable breadcrumb items
- `.breadcrumb-current` - Current page (non-clickable)
- `.breadcrumb-separator` - Separator between items
- `.breadcrumb-icon` - Icon container
- `.breadcrumb-text` - Text label

### Custom Separators
To change the separator, modify the `.breadcrumb-separator` in `Breadcrumbs.css`:

```css
/* Use slash separator */
.breadcrumb-separator::before {
  content: '/';
}

/* Use arrow separator */
.breadcrumb-separator::before {
  content: '→';
}
```

## Examples

### Admin Dashboard
URL: `/admin`
Breadcrumbs: `Home`

### New Quote Page
URL: `/admin/new-quote`
Breadcrumbs: `Home > New Quote`

### Quote Detail Page
URL: `/admin/quotes/507f1f77bcf86cd799439011`
Breadcrumbs: `Home > Quotes > Quote #439011`

### Customer Quote List
URL: `/portal/quotes`
Breadcrumbs: `Portal > My Quotes`

## Best Practices

1. **Keep Labels Concise**: Use short, descriptive labels
2. **Use Icons Sparingly**: Icons should enhance, not clutter
3. **Dynamic Content**: For dynamic pages, fetch data before rendering custom breadcrumbs
4. **Accessibility**: Always provide meaningful labels for screen readers
5. **Consistency**: Use consistent naming across your application

## Troubleshooting

### Breadcrumbs Not Showing
- Ensure the component is imported correctly
- Check if you're on a route that should show breadcrumbs
- Verify the route configuration includes your current path

### Wrong Labels
- Check the `routeConfig` object for your route
- For dynamic routes, ensure you're passing correct custom items

### Mobile Display Issues
- Test on actual devices or responsive mode
- Ensure CSS is loaded correctly
- Check for conflicting styles