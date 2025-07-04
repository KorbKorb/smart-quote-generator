import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = ({ customItems = null }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Route configurations for automatic breadcrumb generation
  const routeConfig = {
    admin: {
      label: 'Dashboard',
      icon: '🏠',
    },
    'new-quote': {
      label: 'New Quote',
      icon: '📝',
    },
    quotes: {
      label: 'Quotes',
      icon: '📋',
    },
    portal: {
      label: 'Portal',
      icon: '🏢',
    },
    dashboard: {
      label: 'Dashboard',
      icon: '📊',
    },
    login: {
      label: 'Login',
      icon: '🔐',
    },
    register: {
      label: 'Register',
      icon: '✍️',
    },
    'registration-success': {
      label: 'Registration Success',
      icon: '✅',
    },
    orders: {
      label: 'Orders',
      icon: '📦',
    },
    account: {
      label: 'Account Settings',
      icon: '⚙️',
    },
    documents: {
      label: 'Documents',
      icon: '📄',
    },
    support: {
      label: 'Support',
      icon: '💬',
    },
  };

  // Generate breadcrumb items from the current path
  const generateBreadcrumbs = () => {
    // If custom items are provided, use them
    if (customItems) {
      return customItems;
    }

    const items = [];
    let currentPath = '';

    // Handle special case for root paths
    if (pathnames.length === 0) {
      return [{ label: 'Home', path: '/', icon: '🏠', current: true }];
    }

    // Determine if we're in admin or portal section
    const isAdmin = pathnames[0] === 'admin';
    const isPortal = pathnames[0] === 'portal';

    if (isAdmin) {
      items.push({
        label: 'Home',
        path: '/admin',
        icon: '🏠',
      });
    } else if (isPortal) {
      items.push({
        label: 'Portal',
        path: '/portal/dashboard',
        icon: '🏢',
      });
    }

    // Build breadcrumb items
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Skip the first 'admin' or 'portal' as we already handled it
      if (index === 0 && (name === 'admin' || name === 'portal')) {
        return;
      }

      // Check if this is a dynamic route (like quote ID)
      const isDynamic = /^[a-f\d]{24}$/i.test(name) || /^[\w\d-]+$/.test(name);
      
      if (isDynamic && index === pathnames.length - 1) {
        // For quote details, show quote number if available
        const prevSegment = pathnames[index - 1];
        if (prevSegment === 'quotes') {
          items.push({
            label: `Quote #${name.slice(-6).toUpperCase()}`,
            path: currentPath,
            current: true,
          });
        } else {
          items.push({
            label: name,
            path: currentPath,
            current: true,
          });
        }
      } else {
        const config = routeConfig[name] || { label: name, icon: null };
        items.push({
          label: config.label,
          path: currentPath,
          icon: config.icon,
          current: index === pathnames.length - 1,
        });
      }
    });

    return items;
  };

  const breadcrumbItems = generateBreadcrumbs();

  // Don't render if only one item (home)
  if (breadcrumbItems.length <= 1 && !customItems) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={item.path || index} className="breadcrumb-item">
              {!isLast ? (
                <>
                  <Link to={item.path} className="breadcrumb-link">
                    {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                    <span className="breadcrumb-text">{item.label}</span>
                  </Link>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                  <span className="breadcrumb-text">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;