// frontend/src/components/QuoteDisplay/QuoteDisplay.jsx
import React from 'react';

const QuoteDisplay = ({ quote }) => {
  if (!quote) return null;

  // Calculate estimated delivery date
  const getDeliveryDate = (urgency) => {
    const date = new Date();
    const daysToAdd = urgency === 'emergency' ? 1 : urgency === 'rush' ? 3 : 7;
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString();
  };

  return (
    <div className="quote-display">
      <div className="quote-header">
        <h3>Quote Summary</h3>
        <span className="quote-id">Quote #{quote.id || 'DRAFT'}</span>
      </div>

      <div className="quote-details">
        <div className="detail-row">
          <span className="label">Material:</span>
          <span className="value">{quote.material}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Thickness:</span>
          <span className="value">{quote.thickness} inches</span>
        </div>

        <div className="detail-row">
          <span className="label">Quantity:</span>
          <span className="value">{quote.quantity}</span>
        </div>

        <div className="detail-row">
          <span className="label">Total Weight:</span>
          <span className="value">{quote.details?.weightPounds || '0'} lbs</span>
        </div>

        <div className="detail-row">
          <span className="label">Total Area:</span>
          <span className="value">{quote.details?.totalAreaSqFt || '0'} sq ft</span>
        </div>

        <div className="detail-row">
          <span className="label">Finish:</span>
          <span className="value">{quote.finishType === 'none' ? 'None' : quote.finishType}</span>
        </div>

        <div className="detail-row">
          <span className="label">Urgency:</span>
          <span className="value urgency-{quote.urgency}">{quote.urgency}</span>
        </div>
      </div>

      <div className="quote-pricing">
        <h4>Pricing Breakdown</h4>
        
        <div className="price-row">
          <span>Material Cost:</span>
          <span>${quote.materialCost || '0.00'}</span>
        </div>
        
        <div className="price-row">
          <span>Cutting & Processing:</span>
          <span>${quote.cuttingCost || '0.00'}</span>
        </div>

        {quote.bendCost && parseFloat(quote.bendCost) > 0 && (
          <div className="price-row">
            <span>Bending:</span>
            <span>${quote.bendCost}</span>
          </div>
        )}
        
        {quote.finishType !== 'none' && (
          <div className="price-row">
            <span>Finish Application:</span>
            <span>${quote.finishCost || '0.00'}</span>
          </div>
        )}
        
        {quote.urgency !== 'standard' && (
          <div className="price-row">
            <span>Rush Fee:</span>
            <span>${quote.rushFee || '0.00'}</span>
          </div>
        )}

        <div className="price-row">
          <span>Subtotal:</span>
          <span>${quote.subtotal || '0.00'}</span>
        </div>
        
        <div className="price-row total">
          <span>Total Cost:</span>
          <span>${quote.total || quote.totalCost || '0.00'}</span>
        </div>
      </div>

      <div className="quote-footer">
        <p className="delivery-info">
          Estimated Delivery: <strong>{getDeliveryDate(quote.urgency)}</strong>
        </p>
        
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => window.print()}>
            Print Quote
          </button>
          <button className="btn-primary">
            Accept Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteDisplay;