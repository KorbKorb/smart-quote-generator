// frontend/src/pages/QuoteHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Papa from 'papaparse';
import './QuoteHistory.css';

const QuoteHistory = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, [filters]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `http://localhost:5000/api/quotes?${params.toString()}`
      );
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    // Prepare data for CSV
    const csvData = quotes.map(quote => ({
      'Quote ID': quote._id,
      'Created Date': formatDate(quote.createdAt),
      'Due Date': formatDate(quote.dueDate),
      'Customer Name': quote.customer.name,
      'Customer Company': quote.customer.company,
      'Customer Email': quote.customer.email,
      'Customer Phone': quote.customer.phone,
      'Status': quote.status.toUpperCase(),
      'Total Price': quote.totalPrice,
      'Item Count': quote.items.length,
      'Part Names': quote.items.map(item => item.partName).join('; '),
      'Materials': quote.items.map(item => item.material).join('; '),
      'Quantities': quote.items.map(item => item.quantity).join('; '),
      'Notes': quote.notes || '',
      // Add detailed pricing for first item (can be expanded for all items)
      'Material Cost': quote.items[0]?.pricing?.costs?.materialCost || '',
      'Cutting Cost': quote.items[0]?.pricing?.costs?.cuttingCost || '',
      'Bend Cost': quote.items[0]?.pricing?.costs?.bendCost || '',
      'Finish Cost': quote.items[0]?.pricing?.costs?.finishCost || '',
      'Measurement Source': quote.items[0]?.pricing?.details?.measurementSource || 'estimated'
    }));

    // Generate CSV
    const csv = Papa.unparse(csvData, {
      quotes: true,
      header: true
    });

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `quotes_export_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (loading && quotes.length === 0) {
    return (
      <div className="quote-history-loading">
        <div className="loading-spinner large"></div>
        <p>Loading quotes...</p>
      </div>
    );
  }

  return (
    <div className="quote-history">
      <div className="page-header">
        <h1>Quote History</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="4" y1="21" x2="4" y2="14" strokeWidth="2" />
              <line x1="4" y1="10" x2="4" y2="3" strokeWidth="2" />
              <line x1="12" y1="21" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="3" strokeWidth="2" />
              <line x1="20" y1="21" x2="20" y2="16" strokeWidth="2" />
              <line x1="20" y1="12" x2="20" y2="3" strokeWidth="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="10" r="2" />
              <circle cx="20" cy="14" r="2" />
            </svg>
            Filters
          </button>
          <button 
            className="btn btn-primary"
            onClick={exportToCSV}
            disabled={quotes.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
              <polyline points="7 10 12 15 17 10" strokeWidth="2" />
              <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel glass-card animate-slideDown">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Customer, company, or ID..."
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="10000"
                min="0"
                step="0.01"
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="createdAt">Date Created</option>
                <option value="totalPrice">Price</option>
                <option value="customer.name">Customer Name</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort Order</label>
              <select
                name="sortOrder"
                value={filters.sortOrder}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="btn btn-ghost"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing <strong>{quotes.length}</strong> quotes
          {filters.search && ` matching "${filters.search}"`}
          {filters.status && ` with status: ${filters.status}`}
          {(filters.startDate || filters.endDate) && ` within date range`}
        </p>
      </div>

      {/* Quotes Table */}
      {quotes.length > 0 ? (
        <div className="quotes-table-container glass-card">
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote._id}>
                  <td className="quote-id">
                    #{quote._id.slice(-6).toUpperCase()}
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{quote.customer.name}</div>
                      <div className="customer-company">{quote.customer.company}</div>
                    </div>
                  </td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td className="items-count">{quote.items.length}</td>
                  <td className="quote-total">{formatCurrency(quote.totalPrice)}</td>
                  <td>
                    <span className={getStatusBadge(quote.status)}>
                      {quote.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/quotes/${quote._id}`} 
                      className="btn btn-ghost btn-sm"
                    >
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
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>No quotes found</h3>
          <p>
            {filters.search || filters.status || filters.startDate || filters.endDate
              ? 'Try adjusting your filters'
              : 'Create your first quote to get started'}
          </p>
          {(filters.search || filters.status || filters.startDate || filters.endDate) && (
            <button className="btn btn-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuoteHistory;
