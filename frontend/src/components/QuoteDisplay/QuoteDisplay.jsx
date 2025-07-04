// frontend/src/components/QuoteDisplay/QuoteDisplay.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmailModal from '../EmailModal';
import './QuoteDisplay.css';

const QuoteDisplay = ({ quote, onAccept, onReject, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animatePrice, setAnimatePrice] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    // Animate price on mount
    setTimeout(() => setAnimatePrice(true), 100);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadPDF = async () => {
    if (!quote._id) return;
    
    setGeneratingPDF(true);
    try {
      // Request PDF generation
      const response = await axios.get(
        `http://localhost:5000/api/quotes/${quote._id}/pdf`,
        {
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quote_${quote._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success notification (optional)
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!quote) return null;

  // Get pricing details from the first item (assuming single item quotes for now)
  const item = quote.items?.[0];
  const pricing = item?.pricing;
  const details = pricing?.details;
  const costs = pricing?.costs;

  return (
    <div className="quote-display">
      {/* Success Animation */}
      <div className="success-animation">
        <svg className="success-checkmark" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="25" fill="none" />
          <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>

      <h2 className="quote-title">Quote Generated Successfully!</h2>
      
      {/* Quote Summary Card */}
      <div className="quote-summary glass-card">
        <div className="quote-header">
          <div className="quote-id">
            <span className="label">Quote ID</span>
            <span className="value">#{quote._id?.slice(-6).toUpperCase()}</span>
          </div>
          <div className="quote-date">
            <span className="label">Created</span>
            <span className="value">{formatDate(quote.createdAt)}</span>
          </div>
        </div>

        {/* Total Price Display */}
        <div className={`total-price-display ${animatePrice ? 'animate' : ''}`}>
          <span className="currency-symbol">$</span>
          <span className="price-value">
            {quote.totalPrice ? parseFloat(quote.totalPrice).toFixed(2) : '0.00'}
          </span>
          <span className="price-label">Total Quote</span>
        </div>

        {/* Measurement Source Badge */}
        {details?.measurementSource && (
          <div className={`measurement-badge ${details.measurementSource}`}>
            {details.measurementSource === 'measured' 
              ? '✓ Measured from DXF' 
              : '≈ Estimated Values'}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="price-breakdown-card glass-card">
        <h3>
          Price Breakdown
          <button 
            className="toggle-details"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points={showDetails ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
            </svg>
          </button>
        </h3>

        <div className="cost-items">
          {costs?.materialCost && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
                Material Cost
              </div>
              <div className="cost-value">{formatCurrency(costs.materialCost)}</div>
            </div>
          )}

          {costs?.cuttingCost && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="6" y1="9" x2="6" y2="15" />
                  <line x1="21" y1="3" x2="14.65" y2="9.35" />
                  <line x1="21" y1="21" x2="14.65" y2="14.65" />
                </svg>
                Cutting Cost
              </div>
              <div className="cost-value">{formatCurrency(costs.cuttingCost)}</div>
            </div>
          )}

          {parseFloat(costs?.pierceCost || 0) > 0 && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                  <circle cx="5" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                </svg>
                Pierce Cost ({details?.holeCount} holes)
              </div>
              <div className="cost-value">{formatCurrency(costs.pierceCost)}</div>
            </div>
          )}

          {parseFloat(costs?.bendCost || 0) > 0 && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Bending Cost ({details?.bendCount} bends)
              </div>
              <div className="cost-value">{formatCurrency(costs.bendCost)}</div>
            </div>
          )}

          {parseFloat(costs?.finishCost || 0) > 0 && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M12 12h.01" />
                </svg>
                Finish Cost
              </div>
              <div className="cost-value">{formatCurrency(costs.finishCost)}</div>
            </div>
          )}

          {parseFloat(costs?.rushFee || 0) > 0 && (
            <div className="cost-item">
              <div className="cost-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Rush Fee
              </div>
              <div className="cost-value">{formatCurrency(costs.rushFee)}</div>
            </div>
          )}

          <div className="cost-item total">
            <div className="cost-label">Total</div>
            <div className="cost-value">{formatCurrency(costs?.total || quote.totalPrice)}</div>
          </div>
        </div>

        {/* Detailed Specifications */}
        {showDetails && details && (
          <div className="part-details animate-slideUp">
            <h4>Part Specifications</h4>
            <div className="detail-grid">
              {details.areaPerPart && (
                <div className="detail-item">
                  <span className="detail-label">Part Area</span>
                  <span className="detail-value">{parseFloat(details.areaPerPart).toFixed(2)} sq in</span>
                </div>
              )}
              {details.totalAreaSqFt && (
                <div className="detail-item">
                  <span className="detail-label">Total Area</span>
                  <span className="detail-value">{parseFloat(details.totalAreaSqFt).toFixed(2)} sq ft</span>
                </div>
              )}
              {details.cutLengthPerPart && (
                <div className="detail-item">
                  <span className="detail-label">Cut Length</span>
                  <span className="detail-value">{parseFloat(details.cutLengthPerPart).toFixed(2)} in</span>
                </div>
              )}
              {details.weightPounds && (
                <div className="detail-item">
                  <span className="detail-label">Total Weight</span>
                  <span className="detail-value">{parseFloat(details.weightPounds).toFixed(2)} lbs</span>
                </div>
              )}
              {details.quantity && (
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value">{details.quantity}</span>
                </div>
              )}
              {details.complexity && (
                <div className="detail-item">
                  <span className="detail-label">Complexity</span>
                  <span className={`detail-value complexity-${details.complexity}`}>
                    {details.complexity}
                  </span>
                </div>
              )}
            </div>

            {details.warnings && details.warnings.length > 0 && (
              <div className="manufacturing-warnings">
                <h5>Manufacturing Notes</h5>
                <ul>
                  {details.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="customer-card glass-card">
        <h3>Customer Information</h3>
        <div className="customer-details">
          <div className="customer-field">
            <span className="field-label">Name</span>
            <span className="field-value">{quote.customer?.name}</span>
          </div>
          <div className="customer-field">
            <span className="field-label">Company</span>
            <span className="field-value">{quote.customer?.company}</span>
          </div>
          <div className="customer-field">
            <span className="field-label">Email</span>
            <span className="field-value">{quote.customer?.email}</span>
          </div>
          <div className="customer-field">
            <span className="field-label">Phone</span>
            <span className="field-value">{quote.customer?.phone}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="quote-actions">
        {quote.status === 'draft' && (
          <>
            <button 
              className="btn btn-success"
              onClick={() => onAccept(quote._id)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" strokeWidth="2" />
              </svg>
              Accept Quote
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => onReject(quote._id)}
            >
              Reject Quote
            </button>
          </>
        )}
        <button 
          className="btn btn-primary"
          onClick={downloadPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <>
              <div className="loading-spinner small"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
                <polyline points="7 10 12 15 17 10" strokeWidth="2" />
                <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowEmailModal(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2" />
            <polyline points="22,6 12,13 2,6" strokeWidth="2" />
          </svg>
          Send Email
        </button>
        <button 
          className="btn btn-ghost"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        quote={quote}
      />
    </div>
  );
};

export default QuoteDisplay;
