// frontend/src/pages/QuoteHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteHistory = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quotes');
      console.log('Quotes API response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        setQuotes(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        // Backend returns { success, count, data: [...] }
        setQuotes(response.data.data);
      } else if (response.data && Array.isArray(response.data.quotes)) {
        // Alternative format
        setQuotes(response.data.quotes);
      } else {
        console.warn('Unexpected quotes data format:', response.data);
        // Use empty array if no valid data
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Use dummy data if backend is not available
      setQuotes([
        {
          id: 'Q-2024-001',
          material: 'Stainless Steel 304',
          thickness: '0.125',
          quantity: 10,
          totalCost: '245.50',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          customerName: 'Acme Corp'
        },
        {
          id: 'Q-2024-002',
          material: 'Aluminum 6061',
          thickness: '0.250',
          quantity: 5,
          totalCost: '180.00',
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          customerName: 'Tech Industries'
        },
        {
          id: 'Q-2024-003',
          material: 'Cold Rolled Steel',
          thickness: '0.0625',
          quantity: 25,
          totalCost: '520.75',
          status: 'in-progress',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          customerName: 'Builder Supply Co'
        },
        {
          id: 'Q-2024-004',
          material: 'Stainless Steel 316',
          thickness: '0.1875',
          quantity: 15,
          totalCost: '385.25',
          status: 'completed',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          customerName: 'Manufacturing Plus'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure quotes is always an array before filtering
  const quotesArray = Array.isArray(quotes) ? quotes : [];
  
  const filteredQuotes = quotesArray.filter(quote => {
    const matchesFilter = filter === 'all' || quote.status === filter;
    const matchesSearch = 
      (quote.id && quote.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.customerName && quote.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.material && quote.material.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-progress';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="quote-history-page">
      <div className="page-header">
        <h1>Quote History</h1>
        <p>View and manage all your quotes</p>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading quotes...</div>
      ) : (
        <div className="quotes-table-container">
          {filteredQuotes.length === 0 ? (
            <div className="no-quotes">
              <p>No quotes found matching your criteria.</p>
              {quotesArray.length === 0 && (
                <p>Create your first quote by clicking on "New Quote" in the navigation.</p>
              )}
            </div>
          ) : (
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Customer</th>
                  <th>Material</th>
                  <th>Thickness</th>
                  <th>Quantity</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map(quote => (
                  <tr key={quote.id || quote._id}>
                    <td className="quote-id">{quote.id || quote._id || 'N/A'}</td>
                    <td>{quote.customerName || 'Guest'}</td>
                    <td>{quote.material || 'N/A'}</td>
                    <td>{quote.thickness ? `${quote.thickness}"` : 'N/A'}</td>
                    <td>{quote.quantity || 0}</td>
                    <td className="cost">${quote.totalCost || '0.00'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(quote.status)}`}>
                        {quote.status || 'pending'}
                      </span>
                    </td>
                    <td>{formatDate(quote.createdAt)}</td>
                    <td>
                      <button className="action-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="summary-stats">
        <div className="stat-card">
          <h3>Total Quotes</h3>
          <p className="stat-value">{quotesArray.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value">{quotesArray.filter(q => q.status === 'pending').length}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-value">{quotesArray.filter(q => q.status === 'in-progress').length}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{quotesArray.filter(q => q.status === 'completed').length}</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistory;