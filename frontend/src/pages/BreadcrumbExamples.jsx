import React from 'react';
import Breadcrumbs from '../components/Breadcrumbs';

// Example component showing different breadcrumb usage patterns
const BreadcrumbExamples = () => {
  // Example 1: Dynamic quote details
  const quoteData = {
    _id: '507f1f77bcf86cd799439011',
    quoteNumber: 'Q202401001',
    customerName: 'Acme Corporation',
  };

  const quoteBreadcrumbs = [
    { label: 'Home', path: '/admin', icon: '🏠' },
    { label: 'Quotes', path: '/admin/quotes', icon: '📋' },
    { label: `Quote #${quoteData.quoteNumber}`, current: true }
  ];

  // Example 2: Multi-level navigation
  const deepBreadcrumbs = [
    { label: 'Portal', path: '/portal', icon: '🏢' },
    { label: 'Orders', path: '/portal/orders', icon: '📦' },
    { label: '2024', path: '/portal/orders/2024' },
    { label: 'January', path: '/portal/orders/2024/01' },
    { label: 'Order #ORD-2024-001', current: true }
  ];

  // Example 3: With status indicators
  const statusBreadcrumbs = [
    { label: 'Home', path: '/admin', icon: '🏠' },
    { label: 'Quotes', path: '/admin/quotes', icon: '📋' },
    { 
      label: 'Pending Review (5)', 
      path: '/admin/quotes?status=pending',
      icon: '⏳'
    },
    { label: 'Quote #Q202401002', current: true }
  ];

  return (
    <div className="breadcrumb-examples">
      <h1>Breadcrumb Component Examples</h1>

      <section>
        <h2>1. Automatic Breadcrumbs (Default)</h2>
        <p>Just add the component and it generates breadcrumbs from the URL:</p>
        <div className="example-box">
          <Breadcrumbs />
        </div>
        <pre>{`<Breadcrumbs />`}</pre>
      </section>

      <section>
        <h2>2. Quote Details with Custom Data</h2>
        <p>Custom breadcrumbs for dynamic content:</p>
        <div className="example-box">
          <Breadcrumbs customItems={quoteBreadcrumbs} />
        </div>
        <pre>{`const quoteBreadcrumbs = [
  { label: 'Home', path: '/admin', icon: '🏠' },
  { label: 'Quotes', path: '/admin/quotes', icon: '📋' },
  { label: \`Quote #\${quoteData.quoteNumber}\`, current: true }
];

<Breadcrumbs customItems={quoteBreadcrumbs} />`}</pre>
      </section>

      <section>
        <h2>3. Deep Navigation</h2>
        <p>Multiple levels of navigation:</p>
        <div className="example-box">
          <Breadcrumbs customItems={deepBreadcrumbs} />
        </div>
      </section>

      <section>
        <h2>4. With Status/Count Information</h2>
        <p>Breadcrumbs can include dynamic information:</p>
        <div className="example-box">
          <Breadcrumbs customItems={statusBreadcrumbs} />
        </div>
      </section>

      <section>
        <h2>5. Mobile View</h2>
        <p>On mobile, breadcrumbs intelligently collapse:</p>
        <div className="example-box mobile-view">
          <Breadcrumbs customItems={deepBreadcrumbs} />
        </div>
        <p className="note">Middle items are hidden with "..." on small screens</p>
      </section>

      <style>{`
        .breadcrumb-examples {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .breadcrumb-examples section {
          margin-bottom: 3rem;
        }

        .breadcrumb-examples h2 {
          margin-bottom: 1rem;
          color: #1a202c;
        }

        .example-box {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border: 1px solid #e2e8f0;
        }

        .mobile-view {
          max-width: 375px;
          overflow: hidden;
        }

        pre {
          background: #1a202c;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.875rem;
        }

        .note {
          font-size: 0.875rem;
          color: #718096;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default BreadcrumbExamples;