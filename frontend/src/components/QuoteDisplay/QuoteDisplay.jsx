// frontend/src/components/QuoteDisplay/QuoteDisplay.jsx
import React from 'react';
import './QuoteDisplay.css';

const QuoteDisplay = ({ quote, onClose, onAccept, onReject, onPrint }) => {
  if (!quote) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(value) || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(quote._id);
    } else {
      alert('Quote accepted! (Function not implemented yet)');
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(quote._id);
    } else {
      alert('Quote rejected! (Function not implemented yet)');
    }
  };

  return (
    <div className="quote-display">
      <div className="quote-header">
        <div className="quote-header-left">
          <h1>Quote #{quote.quoteNumber}</h1>
          <p className="quote-status">
            Status:{' '}
            <span className={`status-${quote.status}`}>{quote.status}</span>
          </p>
        </div>
        <div className="quote-header-right">
          <p>Created: {formatDate(quote.createdAt)}</p>
          <p>Valid Until: {formatDate(quote.dueDate)}</p>
        </div>
      </div>

      <div className="quote-customer">
        <h2>Customer Information</h2>
        <div className="customer-details">
          <p>
            <strong>Name:</strong> {quote.customer.name}
          </p>
          <p>
            <strong>Company:</strong> {quote.customer.company}
          </p>
          <p>
            <strong>Email:</strong> {quote.customer.email}
          </p>
          <p>
            <strong>Phone:</strong> {quote.customer.phone}
          </p>
        </div>
      </div>

      <div className="quote-items">
        <h2>Quote Items</h2>
        <table>
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Material</th>
              <th>Thickness</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={index}>
                <td>{item.partName}</td>
                <td>{item.material}</td>
                <td>{item.thickness}"</td>
                <td>{item.quantity}</td>
                <td>
                  {formatCurrency(
                    parseFloat(item.pricing?.costs?.total) / item.quantity
                  )}
                </td>
                <td>{formatCurrency(item.pricing?.costs?.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="text-right">
                <strong>Total:</strong>
              </td>
              <td>
                <strong>{formatCurrency(quote.totalPrice)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {quote.items[0]?.pricing?.costs && (
        <div className="quote-breakdown">
          <h3>Price Breakdown (First Item)</h3>
          <div className="breakdown-details">
            <div className="breakdown-line">
              <span>Material Cost:</span>
              <span>
                {formatCurrency(quote.items[0].pricing.costs.materialCost)}
              </span>
            </div>
            <div className="breakdown-line">
              <span>Cutting Cost:</span>
              <span>
                {formatCurrency(quote.items[0].pricing.costs.cuttingCost)}
              </span>
            </div>
            {parseFloat(quote.items[0].pricing.costs.bendCost) > 0 && (
              <div className="breakdown-line">
                <span>Bending Cost:</span>
                <span>
                  {formatCurrency(quote.items[0].pricing.costs.bendCost)}
                </span>
              </div>
            )}
            {parseFloat(quote.items[0].pricing.costs.finishCost) > 0 && (
              <div className="breakdown-line">
                <span>Finish Cost:</span>
                <span>
                  {formatCurrency(quote.items[0].pricing.costs.finishCost)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {quote.notes && (
        <div className="quote-notes">
          <h3>Notes</h3>
          <p>{quote.notes}</p>
        </div>
      )}

      <div className="quote-actions no-print">
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
        <button className="btn-print" onClick={handlePrint}>
          Print Quote
        </button>
        {quote.status === 'draft' && (
          <>
            <button className="btn-reject" onClick={handleReject}>
              Reject Quote
            </button>
            <button className="btn-primary" onClick={handleAccept}>
              Accept Quote
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuoteDisplay;
