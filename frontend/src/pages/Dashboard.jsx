// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    acceptedQuotes: 0,
    totalValue: 0,
    conversionRate: 0,
    recentQuotes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quotes');
      const quotesData = response.data.data || []; // Extract the data array from the response
      
      // Calculate statistics
      const totalQuotes = quotesData.length;
      const acceptedQuotes = quotesData.filter(q => q.status === 'accepted').length;
      const totalValue = quotesData
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + (parseFloat(q.totalPrice) || 0), 0);
      const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;
      
      setStats({
        totalQuotes,
        acceptedQuotes,
        totalValue,
        conversionRate,
        recentQuotes: quotesData.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'badge badge-info',
      sent: 'badge badge-warning',
      accepted: 'badge badge-success',
      rejected: 'badge badge-error',
      expired: 'badge badge-error'
    };
    return statusClasses[status] || 'badge';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/admin/new-quote" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11H3v10h6V11zm4-8H7v18h6V3zm4 4h-6v14h6V7zm4 2h-6v12h6V9z" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalQuotes}</h3>
            <p className="stat-label">Total Quotes</p>
          </div>
          <div className="stat-trend trend-up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z" />
            </svg>
            12%
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
              <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.acceptedQuotes}</h3>
            <p className="stat-label">Accepted Quotes</p>
          </div>
          <div className="stat-trend trend-up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z" />
            </svg>
            8%
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatCurrency(stats.totalValue)}</h3>
            <p className="stat-label">Total Revenue</p>
          </div>
          <div className="stat-trend trend-up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z" />
            </svg>
            23%
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 6l-9.5 9.5-5-5L1 18" strokeWidth="2" />
              <polyline points="17 6 23 6 23 12" strokeWidth="2" />
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.conversionRate.toFixed(1)}%</h3>
            <p className="stat-label">Conversion Rate</p>
          </div>
          <div className="stat-trend trend-down">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5H7z" />
            </svg>
            3%
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <Link to="/admin/new-quote" className="action-card">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h3>Create Quote</h3>
            <p>Start a new quotation</p>
          </Link>

          <Link to="/admin/quotes" className="action-card">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3>View All Quotes</h3>
            <p>Browse quote history</p>
          </Link>

          <div className="action-card disabled">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            </div>
            <h3>Analytics</h3>
            <p>Coming soon</p>
          </div>

          <div className="action-card disabled">
            <div className="action-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m11-6h-6m-6 0H1" />
              </svg>
            </div>
            <h3>Settings</h3>
            <p>Coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="recent-quotes">
        <div className="section-header">
          <h2>Recent Quotes</h2>
          <Link to="/admin/quotes" className="btn btn-ghost">View All</Link>
        </div>
        
        {stats.recentQuotes.length > 0 ? (
          <div className="quotes-table glass-card">
            <table>
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentQuotes.map(quote => (
                  <tr key={quote._id} className="table-row">
                    <td className="quote-id">
                      #{quote._id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          {(quote.customerName || quote.customerEmail || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="customer-name">{quote.customerName || 'Unknown'}</div>
                          <div className="customer-company">{quote.customerCompany || quote.customerEmail || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(quote.createdAt)}</td>
                    <td className="amount">{formatCurrency(quote.totalPrice)}</td>
                    <td>
                      <span className={getStatusBadge(quote.status)}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/quotes/${quote._id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state glass-card">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>No quotes yet</h3>
            <p>Create your first quote to get started</p>
            <Link to="/admin/new-quote" className="btn btn-primary">
              Create Quote
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
