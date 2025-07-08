import React, { useState } from 'react';
import './CategoryGroup.css';

const CategoryGroup = ({ categoryData, onQuantityChange, onRemoveItem }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const calculateCategoryTotal = () => {
    return categoryData.items.reduce((total, item) => {
      return total + (item.product.basePrice * item.quantity);
    }, 0);
  };

  return (
    <div className={`category-group ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="category-header" onClick={handleToggleCollapse}>
        <div className="category-info">
          <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
          <h3 className="category-name">{categoryData.category}</h3>
          <span className="item-count">({categoryData.items.length} items)</span>
        </div>
        <div className="category-summary">
          <span className="category-total">
            Subtotal: ${calculateCategoryTotal().toFixed(2)}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="category-items">
          {categoryData.items.map((item, index) => (
            <div key={item._id || index} className="category-item">
              <div className="item-details">
                <span className="item-name">{item.product.name}</span>
                <span className="item-description">{item.product.description}</span>
              </div>
              
              <div className="item-pricing">
                <span className="unit-price">
                  ${item.product.basePrice.toFixed(2)}/{item.product.unit}
                </span>
              </div>

              <div className="item-controls">
                <div className="quantity-wrapper">
                  <button
                    className="qty-btn minus"
                    onClick={() => onQuantityChange(item._id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="quantity-field"
                    value={item.quantity}
                    onChange={(e) => onQuantityChange(item._id, parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <button
                    className="qty-btn plus"
                    onClick={() => onQuantityChange(item._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                
                <span className="item-total">
                  ${(item.product.basePrice * item.quantity).toFixed(2)}
                </span>
                
                <button
                  className="remove-btn"
                  onClick={() => onRemoveItem(item._id)}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {categoryData.discount && (
            <div className="category-discount">
              <span className="discount-label">Category Discount:</span>
              <span className="discount-amount">
                -{categoryData.discount.type === 'percentage' 
                  ? `${categoryData.discount.value}%` 
                  : `$${categoryData.discount.value.toFixed(2)}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryGroup;
