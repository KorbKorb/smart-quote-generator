// frontend/src/components/QuoteForm/QuoteForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuoteForm = ({ uploadedFiles, onQuoteGenerated }) => {
  const [formData, setFormData] = useState({
    material: '',
    thickness: '',
    quantity: 1,
    finishType: 'none',
    bendComplexity: 'simple',
    toleranceLevel: 'standard',
    urgency: 'standard',
    notes: '',
  });

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [pricePreview, setPricePreview] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [dxfData, setDxfData] = useState(null);
  const [analyzingDXF, setAnalyzingDXF] = useState(false);

  // Fetch materials from backend
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/quotes/materials'
        );
        setMaterials(response.data);
      } catch (error) {
        console.error('Error loading materials:', error);
        // Fallback to hardcoded materials if API fails
        setMaterials([
          { id: 1, name: 'Cold Rolled Steel', pricePerPound: 0.85 },
          { id: 2, name: 'Stainless Steel 304', pricePerPound: 2.5 },
          { id: 3, name: 'Stainless Steel 316', pricePerPound: 3.2 },
          { id: 4, name: 'Aluminum 6061', pricePerPound: 1.8 },
        ]);
      }
    };

    fetchMaterials();
  }, []);

  // Analyze DXF files when uploaded
  useEffect(() => {
    const analyzeDXFFiles = async () => {
      if (!uploadedFiles || uploadedFiles.length === 0) {
        setDxfData(null);
        return;
      }

      // Find the first DXF file
      const dxfFile = uploadedFiles.find(file => 
        file.name.toLowerCase().endsWith('.dxf')
      );

      if (!dxfFile) {
        setDxfData(null);
        return;
      }

      setAnalyzingDXF(true);
      setError('');

      try {
        const formData = new FormData();
        formData.append('file', dxfFile);

        const response = await axios.post(
          'http://localhost:5000/api/quotes/analyze-dxf',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.data.success) {
          setDxfData(response.data.data);
          
          // Auto-update bend complexity based on DXF data
          if (response.data.data.bendLines) {
            const bendCount = response.data.data.bendLines.length;
            if (bendCount === 0) {
              setFormData(prev => ({ ...prev, bendComplexity: 'simple' }));
            } else if (bendCount <= 3) {
              setFormData(prev => ({ ...prev, bendComplexity: 'moderate' }));
            } else {
              setFormData(prev => ({ ...prev, bendComplexity: 'complex' }));
            }
          }
        }
      } catch (err) {
        console.error('Error analyzing DXF:', err);
        setError('Could not analyze DXF file. Quote will use estimated values.');
      } finally {
        setAnalyzingDXF(false);
      }
    };

    analyzeDXFFiles();
  }, [uploadedFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate price preview
  const calculatePrice = async () => {
    if (!formData.material || !formData.thickness) {
      setError('Please select material and thickness');
      return;
    }

    setCalculating(true);
    setError('');

    try {
      // Create an item object that matches what the backend expects
      const item = {
        partName:
          uploadedFiles.length > 0 ? uploadedFiles[0].name : 'Custom Part',
        material: formData.material,
        thickness: parseFloat(formData.thickness),
        quantity: parseInt(formData.quantity) || 1,
        finishType: formData.finishType || 'none',
        bendComplexity: formData.bendComplexity,
        toleranceLevel: formData.toleranceLevel,
        urgency: formData.urgency,
        files: uploadedFiles,
        dxfData: dxfData, // Include DXF analysis data
      };

      console.log('Sending item for calculation:', item);

      // Send in the format the backend expects
      const response = await axios.post(
        'http://localhost:5000/api/quotes/calculate',
        { items: [item] } // Wrap in items array
      );

      console.log('Calculate response:', response.data);

      // The response should have items[0].pricing
      if (
        response.data.items &&
        response.data.items[0] &&
        response.data.items[0].pricing
      ) {
        setPricePreview(response.data.items[0].pricing);
        setShowPriceModal(true);
      } else {
        console.error('Unexpected response structure:', response.data);
        setError('Price calculation returned unexpected format');
      }
    } catch (err) {
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(
          err.response.data.error ||
            'Error calculating price. Please try again.'
        );
      } else {
        setError('Error calculating price. Please try again.');
      }
      console.error('Price calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  // Submit the actual quote
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedFiles || uploadedFiles.length === 0) {
      setError('Please upload at least one CAD file');
      return;
    }

    // First calculate the price
    await calculatePrice();
  };

  // Confirm and create the quote
  const confirmQuote = async () => {
    setLoading(true);
    setError('');

    try {
      // Create the item with pricing info
      const item = {
        partName:
          uploadedFiles.length > 0 ? uploadedFiles[0].name : 'Custom Part',
        material: formData.material,
        thickness: parseFloat(formData.thickness),
        quantity: parseInt(formData.quantity) || 1,
        finishType: formData.finishType || 'none',
        bendComplexity: formData.bendComplexity,
        toleranceLevel: formData.toleranceLevel,
        urgency: formData.urgency,
        files: uploadedFiles,
        dxfData: dxfData,
        pricing: pricePreview, // Include the calculated pricing
      };

      // Prepare full quote data
      const quoteData = {
        customer: {
          name: 'Guest User',
          email: 'guest@example.com',
          phone: '555-0123',
          company: 'Guest Company',
        },
        items: [item],
        notes: formData.notes || 'Generated from smart quote form',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      console.log('Sending quote data:', quoteData);

      // Send to backend to create quote
      const response = await axios.post(
        'http://localhost:5000/api/quotes',
        quoteData
      );

      console.log('Quote created:', response.data);

      if (onQuoteGenerated) {
        onQuoteGenerated({
          ...response.data,
          priceDetails: pricePreview,
        });
      }

      // Reset form
      setFormData({
        material: '',
        thickness: '',
        quantity: 1,
        finishType: 'none',
        bendComplexity: 'simple',
        toleranceLevel: 'standard',
        urgency: 'standard',
        notes: '',
      });
      setPricePreview(null);
      setShowPriceModal(false);
      setDxfData(null);

      // Show success message
      alert('Quote created successfully!');
    } catch (err) {
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(
          err.response.data.error || 'Error creating quote. Please try again.'
        );
      } else {
        setError('Error creating quote. Please try again.');
      }
      console.error('Quote creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="quote-form">
        <h3>Quote Details</h3>

        {error && <div className="error-message">{error}</div>}

        {/* DXF Analysis Status */}
        {analyzingDXF && (
          <div className="info-message">Analyzing DXF file...</div>
        )}

        {dxfData && (
          <div className="dxf-info">
            <h4>DXF Analysis Results</h4>
            <div className="dxf-details">
              <div className="dxf-metric">
                <span className="label">Part Area:</span>
                <span className="value">{dxfData.area.toFixed(2)} sq in</span>
              </div>
              <div className="dxf-metric">
                <span className="label">Cut Length:</span>
                <span className="value">{dxfData.cutLength.toFixed(2)} in</span>
              </div>
              <div className="dxf-metric">
                <span className="label">Holes:</span>
                <span className="value">{dxfData.holeCount}</span>
              </div>
              <div className="dxf-metric">
                <span className="label">Bend Lines:</span>
                <span className="value">{dxfData.bendLines.length}</span>
              </div>
              <div className="dxf-metric">
                <span className="label">Complexity:</span>
                <span className={`value complexity-${dxfData.complexity}`}>
                  {dxfData.complexity}
                </span>
              </div>
              <div className="dxf-metric">
                <span className="label">Source:</span>
                <span className="value confidence-badge">
                  Measured from DXF
                </span>
              </div>
            </div>
            {dxfData.warnings && dxfData.warnings.length > 0 && (
              <div className="dxf-warnings">
                <h5>Manufacturing Warnings:</h5>
                <ul>
                  {dxfData.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="material">Material Type *</label>
            <select
              id="material"
              name="material"
              value={formData.material}
              onChange={handleChange}
              required
            >
              <option value="">Select Material</option>
              {materials.length > 0 ? (
                materials.map((mat) => (
                  <option key={mat.id || mat.name} value={mat.name}>
                    {mat.name}{' '}
                    {mat.pricePerPound ? `($${mat.pricePerPound}/lb)` : ''}
                  </option>
                ))
              ) : (
                <option disabled>Loading materials...</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="thickness">Thickness (inches) *</label>
            <input
              type="number"
              id="thickness"
              name="thickness"
              value={formData.thickness}
              onChange={handleChange}
              step="0.001"
              min="0.001"
              placeholder="e.g., 0.125"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="finishType">Finish Type</label>
            <select
              id="finishType"
              name="finishType"
              value={formData.finishType}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="powder-coat">Powder Coat</option>
              <option value="anodized">Anodized</option>
              <option value="painted">Painted</option>
              <option value="polished">Polished</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bendComplexity">
              Bend Complexity 
              {dxfData && dxfData.bendLines.length > 0 && (
                <span className="auto-detected"> (Auto-detected)</span>
              )}
            </label>
            <select
              id="bendComplexity"
              name="bendComplexity"
              value={formData.bendComplexity}
              onChange={handleChange}
            >
              <option value="simple">Simple (0-2 bends)</option>
              <option value="moderate">Moderate (3-5 bends)</option>
              <option value="complex">Complex (6+ bends)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="toleranceLevel">Tolerance Level</label>
            <select
              id="toleranceLevel"
              name="toleranceLevel"
              value={formData.toleranceLevel}
              onChange={handleChange}
            >
              <option value="standard">Standard (±0.010")</option>
              <option value="precision">Precision (±0.005")</option>
              <option value="tight">Tight (±0.002")</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="urgency">Urgency</label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
            >
              <option value="standard">Standard (5-7 days)</option>
              <option value="rush">Rush (2-3 days)</option>
              <option value="emergency">Emergency (24 hours)</option>
            </select>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any special requirements or notes..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={
            calculating ||
            loading ||
            analyzingDXF ||
            !uploadedFiles ||
            uploadedFiles.length === 0
          }
        >
          {calculating ? 'Calculating Price...' : 'Calculate Quote'}
        </button>
      </form>

      {/* Price Preview Modal */}
      {showPriceModal && pricePreview && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Quote Preview</h3>

            {/* Measurement Source Badge */}
            {pricePreview.details?.measurementSource && (
              <div className={`measurement-badge ${pricePreview.details.measurementSource}`}>
                {pricePreview.details.measurementSource === 'measured' 
                  ? '✓ Measured from DXF' 
                  : '≈ Estimated Values'}
              </div>
            )}

            <div className="price-breakdown">
              <h4>Price Breakdown:</h4>
              {pricePreview.costs?.materialCost && (
                <div className="price-line">
                  <span>Material Cost:</span>
                  <span>
                    ${parseFloat(pricePreview.costs.materialCost).toFixed(2)}
                  </span>
                </div>
              )}
              {pricePreview.costs?.cuttingCost && (
                <div className="price-line">
                  <span>Cutting Cost:</span>
                  <span>
                    ${parseFloat(pricePreview.costs.cuttingCost).toFixed(2)}
                  </span>
                </div>
              )}
              {parseFloat(pricePreview.costs?.pierceCost || 0) > 0 && (
                <div className="price-line">
                  <span>Pierce Cost ({pricePreview.details?.holeCount} holes):</span>
                  <span>
                    ${parseFloat(pricePreview.costs.pierceCost).toFixed(2)}
                  </span>
                </div>
              )}
              {parseFloat(pricePreview.costs?.bendCost || 0) > 0 && (
                <div className="price-line">
                  <span>Bending Cost ({pricePreview.details?.bendCount} bends):</span>
                  <span>
                    ${parseFloat(pricePreview.costs.bendCost).toFixed(2)}
                  </span>
                </div>
              )}
              {parseFloat(pricePreview.costs?.finishCost || 0) > 0 && (
                <div className="price-line">
                  <span>Finish Cost:</span>
                  <span>
                    ${parseFloat(pricePreview.costs.finishCost).toFixed(2)}
                  </span>
                </div>
              )}
              {parseFloat(pricePreview.costs?.rushFee || 0) > 0 && (
                <div className="price-line">
                  <span>Rush Fee:</span>
                  <span>
                    ${parseFloat(pricePreview.costs.rushFee).toFixed(2)}
                  </span>
                </div>
              )}
              {pricePreview.costs?.total && (
                <div className="price-line total">
                  <span>Total:</span>
                  <span>
                    ${parseFloat(pricePreview.costs.total).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-details">
              <h4>Part Details:</h4>
              <p>Material: {formData.material}</p>
              <p>
                Quantity: {pricePreview.details?.quantity || formData.quantity}
              </p>
              {pricePreview.details?.areaPerPart && (
                <p>
                  Part Area: {' '}
                  {parseFloat(pricePreview.details.areaPerPart).toFixed(2)} sq in
                </p>
              )}
              {pricePreview.details?.totalAreaSqFt && (
                <p>
                  Total Area:{' '}
                  {parseFloat(pricePreview.details.totalAreaSqFt).toFixed(2)} sq ft
                </p>
              )}
              {pricePreview.details?.cutLengthPerPart && (
                <p>
                  Cut Length per Part:{' '}
                  {parseFloat(pricePreview.details.cutLengthPerPart).toFixed(2)} in
                </p>
              )}
              {pricePreview.details?.weightPounds && (
                <p>
                  Total Weight:{' '}
                  {parseFloat(pricePreview.details.weightPounds).toFixed(2)} lbs
                </p>
              )}
              {pricePreview.details?.complexity && (
                <p>
                  Complexity: <span className={`complexity-${pricePreview.details.complexity}`}>
                    {pricePreview.details.complexity}
                  </span>
                </p>
              )}
            </div>

            {pricePreview.details?.warnings && pricePreview.details.warnings.length > 0 && (
              <div className="modal-warnings">
                <h5>Manufacturing Notes:</h5>
                <ul>
                  {pricePreview.details.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowPriceModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={confirmQuote}
                disabled={loading}
              >
                {loading ? 'Creating Quote...' : 'Confirm & Create Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dxf-info {
          background: #f0f8ff;
          border: 1px solid #0066cc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .dxf-info h4 {
          margin-top: 0;
          color: #0066cc;
        }

        .dxf-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .dxf-metric {
          display: flex;
          flex-direction: column;
        }

        .dxf-metric .label {
          font-size: 0.85rem;
          color: #666;
        }

        .dxf-metric .value {
          font-size: 1.1rem;
          font-weight: bold;
          color: #333;
        }

        .complexity-simple { color: #22c55e; }
        .complexity-moderate { color: #f59e0b; }
        .complexity-complex { color: #ef4444; }

        .confidence-badge {
          background: #22c55e;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .dxf-warnings {
          margin-top: 16px;
          padding: 12px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
        }

        .dxf-warnings h5 {
          margin-top: 0;
          color: #856404;
        }

        .dxf-warnings ul {
          margin: 8px 0 0 20px;
          padding: 0;
        }

        .auto-detected {
          font-size: 0.85rem;
          color: #0066cc;
          font-weight: normal;
        }

        .measurement-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-weight: bold;
        }

        .measurement-badge.measured {
          background: #d1fae5;
          color: #065f46;
        }

        .measurement-badge.estimated {
          background: #fed7aa;
          color: #92400e;
        }

        .modal-warnings {
          margin-top: 16px;
          padding: 12px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
        }

        .modal-warnings h5 {
          margin-top: 0;
          color: #856404;
        }

        .modal-warnings ul {
          margin: 8px 0 0 20px;
          padding: 0;
        }

        .info-message {
          background: #e3f2fd;
          color: #1565c0;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default QuoteForm;
