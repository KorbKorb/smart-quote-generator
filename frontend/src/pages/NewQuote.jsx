// frontend/src/pages/NewQuote.jsx
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload/FileUpload';
import QuoteForm from '../components/QuoteForm/QuoteForm';
import QuoteDisplay from '../components/QuoteDisplay/QuoteDisplay';

const NewQuote = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileUpload = (files) => {
    setUploadedFiles(files);
    if (files.length > 0 && currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleQuoteGenerated = (quote) => {
    // Calculate costs based on the quote data
    const calculateCosts = (quoteData) => {
      // Material properties
      const materials = {
        'Stainless Steel 304': { pricePerPound: 2.5, density: 0.289 },
        'Stainless Steel 316': { pricePerPound: 3.2, density: 0.289 },
        'Aluminum 6061': { pricePerPound: 1.8, density: 0.098 },
        'Cold Rolled Steel': { pricePerPound: 0.85, density: 0.284 },
      };

      const material = materials[quoteData.material] || {
        pricePerPound: 1,
        density: 0.2,
      };
      const thickness = parseFloat(quoteData.thickness) || 0.125;
      const quantity = parseInt(quoteData.quantity) || 1;

      // Estimate 144 sq inches (1 sq ft) per part for demo
      const areaSqIn = 144;
      const volume = areaSqIn * thickness * quantity;
      const weight = volume * material.density;

      // Base costs
      const baseCost = weight * material.pricePerPound;
      const cuttingCost = 25 + quantity * 5; // Setup + per part

      // Finish cost
      const finishCosts = {
        none: 0,
        'powder-coat': quantity * 12,
        anodized: quantity * 15,
        painted: quantity * 10,
        polished: quantity * 18,
      };
      const finishCost = finishCosts[quoteData.finishType] || 0;

      // Rush fee
      const subtotal = baseCost + cuttingCost + finishCost;
      const rushMultipliers = {
        standard: 0,
        rush: 0.25,
        emergency: 0.5,
      };
      const rushFee = subtotal * (rushMultipliers[quoteData.urgency] || 0);

      return {
        baseCost: baseCost.toFixed(2),
        cuttingCost: cuttingCost.toFixed(2),
        finishCost: finishCost.toFixed(2),
        rushFee: rushFee.toFixed(2),
        totalCost: (baseCost + cuttingCost + finishCost + rushFee).toFixed(2),
      };
    };

    // Calculate costs
    const costs = calculateCosts(quote);

    // Add calculated costs to quote
    const enhancedQuote = {
      ...quote,
      ...costs,
      id:
        'Q-' +
        new Date().getFullYear() +
        '-' +
        Math.floor(Math.random() * 10000),
    };

    setGeneratedQuote(enhancedQuote);
    setCurrentStep(3);
  };

  const resetQuote = () => {
    setUploadedFiles([]);
    setGeneratedQuote(null);
    setCurrentStep(1);
  };

  return (
    <div className="new-quote-page">
      <div className="page-header">
        <h1>Create New Quote</h1>
        <p>
          Upload your CAD files and specify requirements to get an instant quote
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Upload Files</span>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Specify Details</span>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Review Quote</span>
        </div>
      </div>

      <div className="quote-content">
        {currentStep === 1 && (
          <div className="step-content">
            <FileUpload onFileUpload={handleFileUpload} />
            {uploadedFiles.length > 0 && (
              <button
                className="btn-primary continue-btn"
                onClick={() => setCurrentStep(2)}
              >
                Continue to Details
              </button>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <div className="uploaded-summary">
              <h4>{uploadedFiles.length} file(s) uploaded</h4>
              <button className="btn-link" onClick={() => setCurrentStep(1)}>
                Change files
              </button>
            </div>
            <QuoteForm
              uploadedFiles={uploadedFiles}
              onQuoteGenerated={handleQuoteGenerated}
            />
          </div>
        )}

        {currentStep === 3 && generatedQuote && (
          <div className="step-content">
            <QuoteDisplay quote={generatedQuote} />
            <button
              className="btn-secondary new-quote-btn"
              onClick={resetQuote}
            >
              Create Another Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewQuote;
