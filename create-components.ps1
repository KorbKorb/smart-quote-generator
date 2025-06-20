# PowerShell script to create all component files with content
Write-Host "Creating component files..." -ForegroundColor Green

# FileUpload.jsx
$fileUploadContent = @'
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

const FileUpload = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dxf': ['.dxf'],
      'application/dwg': ['.dwg'],
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/step': ['.step', '.stp']
    },
    maxFiles: 1
  });

  return (
    <div className="file-upload-container">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="dropzone-text">
            {isDragActive ? 'Drop the file here' : 'Drag & drop your CAD file here'}
          </p>
          <p className="dropzone-subtext">or click to browse</p>
          <p className="dropzone-formats">
            Supported formats: DXF, DWG, PDF, PNG, JPG, STEP
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
'@

# FileUpload.css
$fileUploadCSS = @'
.file-upload-container {
  width: 100%;
}

.dropzone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.dropzone:hover {
  border-color: #1976d2;
  background-color: #f5f5f5;
}

.dropzone.active {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  color: #1976d2;
  opacity: 0.7;
}

.dropzone-text {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.dropzone-subtext {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.dropzone-formats {
  font-size: 0.875rem;
  color: #999;
  margin: 0;
}
'@

# QuoteForm.jsx
$quoteFormContent = @'
import React, { useState } from 'react';
import './QuoteForm.css';

const QuoteForm = ({ materials, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    material: '',
    thickness: '',
    quantity: 1,
    finishType: 'none',
    urgency: 'standard',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="quote-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3 className="section-title">Customer Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Customer Name*</label>
            <input
              type="text"
              name="customerName"
              className="form-control"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email*</label>
            <input
              type="email"
              name="customerEmail"
              className="form-control"
              value={formData.customerEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Part Specifications</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Material*</label>
            <select
              name="material"
              className="form-control"
              value={formData.material}
              onChange={handleChange}
              required
            >
              <option value="">Select a material</option>
              {materials.map(material => (
                <option key={material.id} value={material.name}>
                  {material.name} (${material.pricePerPound}/lb)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Thickness (inches)*</label>
            <input
              type="number"
              name="thickness"
              className="form-control"
              value={formData.thickness}
              onChange={handleChange}
              step="0.001"
              min="0.001"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity*</label>
            <input
              type="number"
              name="quantity"
              className="form-control"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Finish Type</label>
            <select
              name="finishType"
              className="form-control"
              value={formData.finishType}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="brushed">Brushed</option>
              <option value="polished">Polished</option>
              <option value="powder-coated">Powder Coated</option>
              <option value="anodized">Anodized</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Additional Options</h3>
        <div className="form-group">
          <label className="form-label">Urgency</label>
          <select
            name="urgency"
            className="form-control"
            value={formData.urgency}
            onChange={handleChange}
          >
            <option value="standard">Standard (5-7 days)</option>
            <option value="rush">Rush (2-3 days)</option>
            <option value="emergency">Emergency (24 hours)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Special Instructions</label>
          <textarea
            name="notes"
            className="form-control"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Any special requirements or notes..."
          />
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Generating Quote...' : 'Generate Quote'}
        </button>
      </div>
    </form>
  );
};

export default QuoteForm;
'@

# QuoteForm.css
$quoteFormCSS = @'
.quote-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}
'@

# QuoteDisplay.jsx
$quoteDisplayContent = @'
import React from 'react';
import './QuoteDisplay.css';

const QuoteDisplay = ({ quote }) => {
  const calculateTotal = () => {
    const basePrice = quote.estimatedPrice || 1234.56;
    const urgencyMultiplier = {
      'standard': 1,
      'rush': 1.5,
      'emergency': 2
    };
    return basePrice * (urgencyMultiplier[quote.urgency] || 1);
  };

  const total = calculateTotal();

  return (
    <div className="quote-display">
      <div className="card">
        <h2 className="card-title">Quote Summary</h2>
        
        <div className="quote-header">
          <div>
            <h3>Quote #{quote.id || Date.now()}</h3>
            <p className="quote-date">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="quote-status">
            <span className="status status-pending">Draft</span>
          </div>
        </div>

        <div className="quote-section">
          <h4>Customer Information</h4>
          <div className="info-grid">
            <div>
              <label>Name:</label>
              <span>{quote.customerName}</span>
            </div>
            <div>
              <label>Email:</label>
              <span>{quote.customerEmail}</span>
            </div>
          </div>
        </div>

        <div className="quote-section">
          <h4>Part Details</h4>
          <div className="info-grid">
            <div>
              <label>Material:</label>
              <span>{quote.material}</span>
            </div>
            <div>
              <label>Thickness:</label>
              <span>{quote.thickness} inches</span>
            </div>
            <div>
              <label>Quantity:</label>
              <span>{quote.quantity} units</span>
            </div>
            <div>
              <label>Finish:</label>
              <span>{quote.finishType}</span>
            </div>
          </div>
        </div>

        <div className="quote-section">
          <h4>Pricing Breakdown</h4>
          <table className="pricing-table">
            <tbody>
              <tr>
                <td>Base Price</td>
                <td className="price">${(quote.estimatedPrice || 1234.56).toFixed(2)}</td>
              </tr>
              {quote.urgency !== 'standard' && (
                <tr>
                  <td>Rush Processing</td>
                  <td className="price">
                    {quote.urgency === 'rush' ? '+50%' : '+100%'}
                  </td>
                </tr>
              )}
              <tr className="total-row">
                <td>Total</td>
                <td className="price total">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {quote.notes && (
          <div className="quote-section">
            <h4>Special Instructions</h4>
            <p className="notes">{quote.notes}</p>
          </div>
        )}

        <div className="quote-footer">
          <p className="disclaimer">
            This quote is valid for 30 days from the date of generation. 
            Prices are subject to material availability and final design review.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuoteDisplay;
'@

# QuoteDisplay.css
$quoteDisplayCSS = @'
.quote-display {
  max-width: 800px;
  margin: 0 auto;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.quote-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.quote-date {
  color: #666;
  font-size: 0.875rem;
}

.quote-section {
  margin-bottom: 2rem;
}

.quote-section h4 {
  margin-bottom: 1rem;
  color: #555;
  font-size: 1.125rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-grid > div {
  display: flex;
  flex-direction: column;
}

.info-grid label {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.info-grid span {
  color: #333;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
}

.pricing-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.pricing-table .price {
  text-align: right;
  font-weight: 500;
}

.pricing-table .total-row {
  border-top: 2px solid #333;
  font-weight: bold;
}

.pricing-table .total-row .total {
  font-size: 1.25rem;
  color: #1976d2;
}

.notes {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  white-space: pre-wrap;
}

.quote-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.disclaimer {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}
'@

# Create component files
Set-Content -Path "src\components\FileUpload\FileUpload.jsx" -Value $fileUploadContent
Write-Host "Created: src\components\FileUpload\FileUpload.jsx" -ForegroundColor Yellow

Set-Content -Path "src\components\FileUpload\FileUpload.css" -Value $fileUploadCSS
Write-Host "Created: src\components\FileUpload\FileUpload.css" -ForegroundColor Yellow

Set-Content -Path "src\components\QuoteForm\QuoteForm.jsx" -Value $quoteFormContent
Write-Host "Created: src\components\QuoteForm\QuoteForm.jsx" -ForegroundColor Yellow

Set-Content -Path "src\components\QuoteForm\QuoteForm.css" -Value $quoteFormCSS
Write-Host "Created: src\components\QuoteForm\QuoteForm.css" -ForegroundColor Yellow

Set-Content -Path "src\components\QuoteDisplay\QuoteDisplay.jsx" -Value $quoteDisplayContent
Write-Host "Created: src\components\QuoteDisplay\QuoteDisplay.jsx" -ForegroundColor Yellow

Set-Content -Path "src\components\QuoteDisplay\QuoteDisplay.css" -Value $quoteDisplayCSS
Write-Host "Created: src\components\QuoteDisplay\QuoteDisplay.css" -ForegroundColor Yellow

Write-Host "`nAll components created successfully!" -ForegroundColor Green
Write-Host "Make sure to update App.css with all the styles!" -ForegroundColor Cyan