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
    notes: ''
  });

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default materials in case API fails
  const defaultMaterials = [
    { id: '1', name: 'Stainless Steel 304', pricePerPound: 2.5 },
    { id: '2', name: 'Stainless Steel 316', pricePerPound: 3.2 },
    { id: '3', name: 'Aluminum 6061', pricePerPound: 1.8 },
    { id: '4', name: 'Cold Rolled Steel', pricePerPound: 0.85 }
  ];

  // Fetch materials from backend
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/materials');
        console.log('Materials API response:', response.data);
        
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          setMaterials(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          // Backend returns { success, count, data: [...] }
          setMaterials(response.data.data);
        } else if (response.data && Array.isArray(response.data.materials)) {
          // Sometimes APIs return data wrapped in an object
          setMaterials(response.data.materials);
        } else {
          console.warn('Unexpected materials data format:', response.data);
          setMaterials(defaultMaterials);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
        // Use default materials if API fails
        setMaterials(defaultMaterials);
      }
    };
    
    fetchMaterials();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      setError('Please upload at least one CAD file');
      return;
    }

    if (!formData.material || !formData.thickness) {
      setError('Please select material and thickness');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare quote data
      const quoteData = {
        ...formData,
        files: uploadedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
        createdAt: new Date().toISOString()
      };

      // Send to backend
      const response = await axios.post('http://localhost:5000/api/quotes', quoteData);
      
      if (onQuoteGenerated) {
        onQuoteGenerated(response.data);
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
        notes: ''
      });

    } catch (err) {
      setError('Error generating quote. Please try again.');
      console.error('Quote generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quote-form">
      <h3>Quote Details</h3>
      
      {error && <div className="error-message">{error}</div>}

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
              materials.map(mat => (
                <option key={mat.id || mat.name} value={mat.name}>
                  {mat.name} {mat.pricePerPound ? `(${mat.pricePerPound}/lb)` : ''}
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
          <label htmlFor="bendComplexity">Bend Complexity</label>
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
        disabled={loading || !uploadedFiles || uploadedFiles.length === 0}
      >
        {loading ? 'Generating Quote...' : 'Generate Quote'}
      </button>
    </form>
  );
};

export default QuoteForm;