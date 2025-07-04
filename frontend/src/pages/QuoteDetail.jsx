// frontend/src/pages/QuoteDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuoteDisplay from '../components/QuoteDisplay/QuoteDisplay';
import './QuoteDetail.css';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/quotes/${id}`);
      setQuote(response.data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setError('Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (quoteId) => {
    try {
      await axios.patch(`http://localhost:5000/api/quotes/${quoteId}/status`, {
        status: 'accepted'
      });
      fetchQuote(); // Refresh quote data
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Failed to update quote status');
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await axios.patch(`http://localhost:5000/api/quotes/${quoteId}/status`, {
        status: 'rejected'
      });
      fetchQuote(); // Refresh quote data
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Failed to update quote status');
    }
  };

  const handleClose = () => {
    navigate('/quotes');
  };

  if (loading) {
    return (
      <div className="quote-detail-loading">
        <div className="loading-spinner large"></div>
        <p>Loading quote details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quote-detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/quotes')}>
          Back to Quotes
        </button>
      </div>
    );
  }

  return (
    <div className="quote-detail-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/quotes')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6" strokeWidth="2" />
          </svg>
          Back to Quotes
        </button>
        <h1>Quote Details</h1>
      </div>

      {quote && (
        <QuoteDisplay
          quote={quote}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default QuoteDetail;
