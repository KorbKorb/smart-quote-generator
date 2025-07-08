import React from 'react';
import './PackageSummary.css';

const PackageSummary = ({ packageData, onSaveQuote, onExport }) => {
  const { pricing, items } = packageData;

  const getDiscountLabel = (discount) => {
    switch (discount.type) {
      case 'volume':
        return 'Volume Discount';
      case 'bundle':
        return 'Bundle Discount';
      case 'category':
        return 'Category Discount';
      case 'tiered':
        return 'Tiered Discount';
      default:
        return 'Discount';
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCategoryCount = () => {
    const categories = new Set(items.map(item => item.product.category));
    return categories.size;
  };

  return (
    <div className="package-summary">
      <div className="summary-header">
        <h2>Package Quote Summary</h2>
        <div className="package-stats">
          <div className="stat">
            <span className="stat-value">{getTotalItems()}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat">
            <span className="stat-value">{getCategoryCount()}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pricing.discounts.length}</span>
            <span className="stat-label">Discounts Applied</span>
          </div>
        </div>
      </div>

      <div className="pricing-breakdown">
        <div className="pricing-section">
          <h3>Price Breakdown</h3>
          
          <div className="price-line">
            <span className="price-label">Subtotal</span>
            <span className="price-value">${pricing.subtotal.toFixed(2)}</span>
          </div>

          {pricing.discounts.map((discount, index) => (
            <div key={index} className="price-line discount-line">
              <span className="price-label">
                {getDiscountLabel(discount)}
                <span className="discount-detail">
                  {discount.reason && ` (${discount.reason})`}
                </span>
              </span>
              <span className="price-value discount">
                -${discount.amount.toFixed(2)}
              </span>
            </div>
          ))}

          <div className="price-line total">
            <span className="price-label">Total</span>
            <span className="price-value">${pricing.total.toFixed(2)}</span>
          </div>

          {pricing.totalDiscount > 0 && (
            <div className="savings-banner">
              <span className="savings-icon">🎉</span>
              <span className="savings-text">
                You saved ${pricing.totalDiscount.toFixed(2)} ({pricing.discountPercentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        <div className="categories-section">
          <h3>Items by Category</h3>
          {pricing.categories.map((category, index) => (
            <div key={index} className="category-summary-item">
              <div className="category-details">
                <span className="category-name">{category.name}</span>
                <span className="category-items">{category.itemCount} items</span>
              </div>
              <span className="category-total">${category.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-actions">
        <button 
          className="btn btn-primary"
          onClick={onSaveQuote}
        >
          Save Quote
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => onExport('pdf')}
        >
          Export PDF
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => onExport('excel')}
        >
          Export Excel
        </button>
      </div>

      {pricing.appliedRules && pricing.appliedRules.length > 0 && (
        <div className="applied-rules">
          <h4>Applied Discount Rules</h4>
          <ul>
            {pricing.appliedRules.map((rule, index) => (
              <li key={index}>
                <strong>{rule.name}:</strong> {rule.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PackageSummary;
