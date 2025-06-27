// frontend/src/pages/NewQuote.jsx
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload/FileUpload';
import QuoteForm from '../components/QuoteForm/QuoteForm';
import QuoteDisplay from '../components/QuoteDisplay/QuoteDisplay';
import axios from 'axios';

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
    // The quote comes from the backend with all pricing already calculated
    console.log('Quote received from backend:', quote);
    setGeneratedQuote(quote);
    setCurrentStep(3);
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/quotes/${quoteId}/status`,
        { status: 'accepted' }
      );

      if (response.status === 200) {
        alert('Quote accepted successfully!');
        // Update the local quote status
        setGeneratedQuote((prev) => ({ ...prev, status: 'accepted' }));
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quoteId) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/quotes/${quoteId}/status`,
        { status: 'rejected' }
      );

      if (response.status === 200) {
        alert('Quote rejected');
        setGeneratedQuote((prev) => ({ ...prev, status: 'rejected' }));
      }
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Failed to reject quote');
    }
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
            <QuoteDisplay
              quote={generatedQuote}
              onClose={resetQuote}
              onAccept={handleAcceptQuote}
              onReject={handleRejectQuote}
            />
            <div
              className="quote-actions"
              style={{ marginTop: '20px', textAlign: 'center' }}
            >
              <button
                className="btn-secondary new-quote-btn"
                onClick={resetQuote}
              >
                Create Another Quote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewQuote;
