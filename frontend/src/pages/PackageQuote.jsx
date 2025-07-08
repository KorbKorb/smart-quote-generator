import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { PackageBuilder, CategoryGroup, PackageSummary } from '../components/PackageQuoting';
import './PackageQuote.css';

const PackageQuote = () => {
  const [step, setStep] = useState('builder'); // builder, review, summary
  const [packageItems, setPackageItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [pricingData, setPricingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group items by category
  useEffect(() => {
    if (packageItems.length > 0) {
      const grouped = packageItems.reduce((acc, item) => {
        const category = item.product.category;
        if (!acc[category]) {
          acc[category] = {
            category,
            items: [],
          };
        }
        acc[category].items.push(item);
        return acc;
      }, {});
      setGroupedItems(grouped);
    }
  }, [packageItems]);

  const handlePackageComplete = async (data) => {
    setPackageItems(data.items);
    setPricingData(data.pricing);
    setStep('review');
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const updatedItems = packageItems.map(item => 
      item._id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
    );
    setPackageItems(updatedItems);
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = packageItems.filter(item => item._id !== itemId);
    setPackageItems(updatedItems);
    
    if (updatedItems.length === 0) {
      setStep('builder');
      setPricingData(null);
    }
  };

  const handleRecalculatePricing = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/package-quotes/calculate-pricing', {
        items: packageItems,
      });

      if (response.data.success) {
        setPricingData(response.data.data);
        setStep('summary');
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

  const handleSaveQuote = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/package-quotes/create', {
        items: packageItems,
        pricing: pricingData,
        notes: '', // Add notes field if needed
      });

      if (response.data.success) {
        // Handle successful save (e.g., redirect, show success message)
        alert('Package quote saved successfully!');
      } else {
        setError(response.data.message || 'Failed to save quote');
      }
    } catch (err) {
      console.error('Error saving quote:', err);
      setError('Failed to save quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format) => {
    // Implement export functionality
    console.log(`Exporting as ${format}`);
    alert(`Export to ${format.toUpperCase()} functionality will be implemented`);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'builder', label: 'Build Package', icon: '📦' },
      { key: 'review', label: 'Review Items', icon: '✏️' },
      { key: 'summary', label: 'Quote Summary', icon: '💰' },
    ];

    return (
      <div className="step-indicator">
        {steps.map((s, index) => (
          <div
            key={s.key}
            className={`step ${step === s.key ? 'active' : ''} ${
              steps.findIndex(st => st.key === step) > index ? 'completed' : ''
            }`}
          >
            <div className="step-icon">{s.icon}</div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="package-quote-page">
      <div className="page-header">
        <h1>Package Quote Generator</h1>
        <p>Create multi-product quotes with automatic bundle discounts</p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="page-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {step === 'builder' && (
        <PackageBuilder onPackageComplete={handlePackageComplete} />
      )}

      {step === 'review' && (
        <div className="review-section">
          <div className="review-header">
            <h2>Review Your Package</h2>
            <div className="review-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setStep('builder')}
              >
                ← Back to Builder
              </button>
              <button
                className="btn btn-cta"
                onClick={handleRecalculatePricing}
                disabled={isLoading || packageItems.length === 0}
              >
                {isLoading ? 'Calculating...' : 'Calculate Final Price →'}
              </button>
            </div>
          </div>

          <div className="category-groups">
            {Object.values(groupedItems).map((categoryData) => (
              <CategoryGroup
                key={categoryData.category}
                categoryData={categoryData}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>

          {pricingData && (
            <div className="preliminary-pricing">
              <div className="pricing-preview">
                <span className="preview-label">Estimated Total:</span>
                <span className="preview-amount">${pricingData.total.toFixed(2)}</span>
                {pricingData.totalDiscount > 0 && (
                  <span className="preview-savings">
                    Save ${pricingData.totalDiscount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'summary' && pricingData && (
        <>
          <div className="summary-actions-top">
            <button
              className="btn btn-secondary"
              onClick={() => setStep('review')}
            >
              ← Edit Package
            </button>
          </div>
          <PackageSummary
            packageData={{ items: packageItems, pricing: pricingData }}
            onSaveQuote={handleSaveQuote}
            onExport={handleExport}
          />
        </>
      )}
    </div>
  );
};

export default PackageQuote;
