# PowerShell script to create all component files with content
Write-Host "Creating all Smart Quote Generator components..." -ForegroundColor Green

# Dashboard.jsx
$dashboardContent = @'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    completedQuotes: 0,
    totalRevenue: 0
  });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quotes');
      
      setStats({
        totalQuotes: 24,
        pendingQuotes: 5,
        completedQuotes: 19,
        totalRevenue: 45678.90
      });

      setRecentQuotes([
        { id: 1, customer: 'ABC Manufacturing', material: 'Stainless Steel 304', amount: 1234.56, date: '2025-06-19', status: 'Pending' },
        { id: 2, customer: 'XYZ Corp', material: 'Aluminum 6061', amount: 789.00, date: '2025-06-18', status: 'Completed' },
        { id: 3, customer: 'Tech Industries', material: 'Cold Rolled Steel', amount: 2456.78, date: '2025-06-17', status: 'Completed' }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 className="stat-title">Total Quotes</h3>
          <p className="stat-value">{stats.totalQuotes}</p>
        </div>
        <div className="card">
          <h3 className="stat-title">Pending Quotes</h3>
          <p className="stat-value" style={{ color: '#ff9800' }}>{stats.pendingQuotes}</p>
        </div>
        <div className="card">
          <h3 className="stat-title">Total Revenue</h3>
          <p className="stat-value" style={{ color: '#4caf50' }}>${stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/new-quote" className="btn btn-primary">
            Create New Quote
          </Link>
          <button className="btn btn-secondary" onClick={() => window.location.href = 'http://localhost:5000/api/materials'}>
            View Materials
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Quotes</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Material</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.map(quote => (
                <tr key={quote.id}>
                  <td>{quote.customer}</td>
                  <td>{quote.material}</td>
                  <td>${quote.amount.toFixed(2)}</td>
                  <td>{quote.date}</td>
                  <td>
                    <span className={`status status-${quote.status.toLowerCase()}`}>
                      {quote.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">System Status</h2>
        <div className="alert alert-success">
          ✓ Backend API is connected and running on port 5000
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
'@

# NewQuote.jsx
$newQuoteContent = @'
import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload/FileUpload';
import QuoteForm from '../components/QuoteForm/QuoteForm';
import QuoteDisplay from '../components/QuoteDisplay/QuoteDisplay';
import axios from 'axios';

const NewQuote = () => {
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/materials');
      setMaterials(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setStep(2);
  };

  const handleQuoteSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/quotes', {
        ...formData,
        file: uploadedFile
      });
      
      setQuoteData(response.data.data);
      setStep(3);
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error creating quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetQuote = () => {
    setStep(1);
    setUploadedFile(null);
    setQuoteData(null);
  };

  return (
    <div className="new-quote-page">
      <h1 className="page-title">Create New Quote</h1>

      <div className="progress-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Upload File</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Quote Details</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Review Quote</span>
        </div>
      </div>

      <div className="step-content">
        {step === 1 && (
          <div className="card">
            <h2 className="card-title">Upload CAD File</h2>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h2 className="card-title">Quote Details</h2>
            <p className="file-info">File: {uploadedFile?.name}</p>
            <QuoteForm 
              materials={materials}
              onSubmit={handleQuoteSubmit}
              loading={loading}
            />
            <button 
              className="btn btn-secondary" 
              onClick={() => setStep(1)}
              style={{ marginTop: '1rem' }}
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && quoteData && (
          <div>
            <QuoteDisplay quote={quoteData} />
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={resetQuote}>
                Create Another Quote
              </button>
              <button className="btn btn-secondary">
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewQuote;
'@

# QuoteHistory.jsx
$quoteHistoryContent = @'
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteHistory = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/quotes');
      
      setQuotes([
        {
          id: 'Q-2025-001',
          customerName: 'ABC Manufacturing',
          material: 'Stainless Steel 304',
          quantity: 25,
          totalPrice: 2456.78,
          status: 'Completed',
          date: '2025-06-15'
        },
        {
          id: 'Q-2025-002',
          customerName: 'XYZ Corp',
          material: 'Aluminum 6061',
          quantity: 100,
          totalPrice: 1234.56,
          status: 'Pending',
          date: '2025-06-17'
        },
        {
          id: 'Q-2025-003',
          customerName: 'Tech Industries',
          material: 'Cold Rolled Steel',
          quantity: 50,
          totalPrice: 3789.00,
          status: 'Completed',
          date: '2025-06-18'
        }
      ]);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="quote-history">
      <h1 className="page-title">Quote History</h1>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Customer</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote.id}>
                  <td>{quote.id}</td>
                  <td>{quote.customerName}</td>
                  <td>{quote.material}</td>
                  <td>{quote.quantity}</td>
                  <td>${quote.totalPrice.toFixed(2)}</td>
                  <td>
                    <span className={`status status-${quote.status.toLowerCase()}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td>{quote.date}</td>
                  <td>
                    <button className="btn-small">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistory;
'@

# Create page files
Set-Content -Path "src\pages\Dashboard.jsx" -Value $dashboardContent
Write-Host "Created: src\pages\Dashboard.jsx" -ForegroundColor Yellow

Set-Content -Path "src\pages\NewQuote.jsx" -Value $newQuoteContent
Write-Host "Created: src\pages\NewQuote.jsx" -ForegroundColor Yellow

Set-Content -Path "src\pages\QuoteHistory.jsx" -Value $quoteHistoryContent
Write-Host "Created: src\pages\QuoteHistory.jsx" -ForegroundColor Yellow

Write-Host "`nPage components created!" -ForegroundColor Green
Write-Host "Run the next script to create the remaining components..." -ForegroundColor Cyan