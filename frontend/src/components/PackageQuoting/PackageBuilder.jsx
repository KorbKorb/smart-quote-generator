import React, { useState } from 'react';
import axios from '../../utils/axios';
import './PackageBuilder.css';

const PackageBuilder = ({ onPackageComplete }) => {
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Sample text for demonstration
  const sampleText = `Mild Steel Sheet 4x8 x 5
I-Beam 6" - 20
Hex Bolt 1/2" x 2" (200)
Flat Washer 1/2", 300
Square Tube 2x2x1/4 - 15 pieces`;

  const handleParseProducts = async () => {
    if (!inputText.trim()) {
      setError('Please enter at least one product');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/package-quotes/parse-products', {
        text: inputText,
      });

      if (response.data.success) {
        setParsedItems(response.data.data);
        setShowResults(true);
      } else {
        setError(response.data.message || 'Failed to parse products');
      }
    } catch (err) {
      console.error('Error parsing products:', err);
      setError('Failed to parse products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedItems = { ...parsedItems };
    if (updatedItems.found[index]) {
      updatedItems.found[index].quantity = parseInt(newQuantity) || 0;
      setParsedItems(updatedItems);
    }
  };

  const handleCalculatePricing = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/package-quotes/calculate-pricing', {
        items: parsedItems.found,
      });

      if (response.data.success) {
        onPackageComplete({
          items: parsedItems.found,
          pricing: response.data.data,
        });
      } else {
        setError(response.data.message || 'Failed to calculate pricing');
      }
    } catch (err) {
      console.error('Error calculating pricing:', err);
      setError('Failed to calculate pricing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInputText('');
    setParsedItems(null);
    setShowResults(false);
    setError('');
  };

  const handleUseSample = () => {
    setInputText(sampleText);
  };

  return (
    <div className="package-builder">
      <div className="package-builder-header">
        <h2>Package Quote Builder</h2>
        <p className="subtitle">Enter multiple products to build a package quote with automatic discounts</p>
      </div>

      {!showResults ? (
        <div className="input-section">
          <div className="input-header">
            <label htmlFor="product-input">Enter Products</label>
            <button
              type="button"
              className="btn-link"
              onClick={handleUseSample}
            >
              Use Sample
            </button>
          </div>
          
          <textarea
            id="product-input"
            className="product-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter products, one per line. Examples:
Steel Plate 1/2&quot; 4x8 - 10 sheets
Angle Iron 2x2x1/4 x 20ft (5)
Round Bar 1&quot; x 3ft, qty: 25"
            rows={10}
          />

          <div className="input-help">
            <h4>Supported Formats:</h4>
            <ul>
              <li>Product Name - Quantity</li>
              <li>Product Name (Quantity)</li>
              <li>Product Name x Quantity</li>
              <li>Product Name, qty: Quantity</li>
            </ul>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleParseProducts}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? 'Parsing...' : 'Parse Products'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={!inputText}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="results-section">
          <div className="results-header">
            <h3>Parsed Products</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
            >
              Start Over
            </button>
          </div>

          {parsedItems.found.length > 0 && (
            <div className="found-products">
              <h4 className="section-title">
                <span className="success-icon">✓</span>
                Found Products ({parsedItems.found.length})
              </h4>
              <div className="product-list">
                {parsedItems.found.map((item, index) => (
                  <div key={index} className="product-item">
                    <div className="product-info">
                      <span className="product-name">{item.product.name}</span>
                      <span className="product-category">{item.product.category}</span>
                      <span className="product-price">
                        ${item.product.basePrice.toFixed(2)}/{item.product.unit}
                      </span>
                    </div>
                    <div className="quantity-control">
                      <label htmlFor={`qty-${index}`}>Qty:</label>
                      <input
                        id={`qty-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="quantity-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedItems.notFound.length > 0 && (
            <div className="not-found-products">
              <h4 className="section-title">
                <span className="warning-icon">!</span>
                Not Found ({parsedItems.notFound.length})
              </h4>
              <div className="not-found-list">
                {parsedItems.notFound.map((item, index) => (
                  <div key={index} className="not-found-item">
                    <span className="original-text">{item.originalText}</span>
                    <span className="search-term">Searched: "{item.searchTerm}"</span>
                  </div>
                ))}
              </div>
              <p className="help-text">
                These items were not found in the catalog. You may need to add them manually or check the spelling.
              </p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn btn-cta"
              onClick={handleCalculatePricing}
              disabled={isLoading || parsedItems.found.length === 0}
            >
              {isLoading ? 'Calculating...' : 'Calculate Package Price'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageBuilder;
