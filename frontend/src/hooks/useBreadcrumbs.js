import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export const useBreadcrumbs = (customConfig = {}) => {
  const location = useLocation();
  const params = useParams();

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const items = [];

    // Base configurations
    const config = {
      '/admin': { label: 'Dashboard', icon: '🏠' },
      '/admin/new-quote': { label: 'New Quote', icon: '📝' },
      '/admin/quotes': { label: 'Quotes', icon: '📋' },
      '/portal': { label: 'Portal', icon: '🏢' },
      '/portal/dashboard': { label: 'Dashboard', icon: '📊' },
      '/portal/quotes': { label: 'My Quotes', icon: '📋' },
      '/portal/orders': { label: 'Orders', icon: '📦' },
      '/portal/account': { label: 'Account', icon: '⚙️' },
      ...customConfig,
    };

    let currentPath = '';
    
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Handle dynamic segments
      if (params.id && segment === params.id) {
        // This is a dynamic ID segment
        const prevSegment = pathnames[index - 1];
        if (prevSegment === 'quotes') {
          items.push({
            label: `Quote #${segment.slice(-6).toUpperCase()}`,
            path: currentPath,
          });
        } else {
          items.push({
            label: segment,
            path: currentPath,
          });
        }
      } else {
        // Regular segment
        const configItem = config[currentPath];
        if (configItem) {
          items.push({
            ...configItem,
            path: currentPath,
          });
        } else {
          // Fallback for unconfigured routes
          items.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
            path: currentPath,
          });
        }
      }
    });

    return items;
  }, [location.pathname, params, customConfig]);

  return breadcrumbs;
};