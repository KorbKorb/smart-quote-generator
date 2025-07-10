// Enhanced Quote Form with integrated DXF upload and visualization
import React, { useState, useEffect } from 'react';
import { DXFUploader, DXFViewer } from '../DXF/DXFUploader';
import api from '../../services/api';

const EnhancedQuoteForm = ({ onQuoteGenerated }) => {
  const [formData, setFormData] = useState({
    material: 'Cold Rolled Steel',
    thickness: 0.125,
    quantity: 1,
    finishType: 'none',
    urgency: 'standard',
    toleranceLevel: 'standard',
    notes: '',
  });

  const [dxfData, setDxfData] = useState(null);
  const [manualDimensions, setManualDimensions] = useState({
    length: '',
    width: '',
    holes: 0,
    bends: 0,
  });

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useManualInput, setUseManualInput] = useState(false);

  // Material options
  const materials = [
    { value: 'cold-rolled-steel', label: 'Cold Rolled Steel', pricePerPound: 0.85 },
    { value: 'stainless-304', label: 'Stainless Steel 304', pricePerPound: 2.50 },
    { value: 'stainless-316', label: 'Stainless Steel 316', pricePerPound: 3.20 },
    { value: 'aluminum-6061', label: 'Aluminum 6061', pricePerPound: 1.80 },
  ];

  // Thickness options (in inches)
  const thicknesses = [
    { value: 0.0625, label: '1/16"' },
    { value: 0.125, label: '1/8"' },
    { value: 0.1875, label: '3/16"' },
    { value: 0.25, label: '1/4"' },
    { value: 0.375, label: '3/8"' },
    { value: 0.5, label: '1/2"' },
  ];

  // Finish options
  const finishes = [
    { value: 'none', label: 'None' },
    { value: 'powder-coat', label: 'Powder Coat' },
    { value: 'anodize', label: 'Anodize' },
    { value: 'zinc-plate', label: 'Zinc Plate' },
  ];

  // Urgency options
  const urgencyOptions = [
    { value: 'standard', label: 'Standard (5-7 days)' },
    { value: 'rush', label: 'Rush (2-3 days)' },
    { value: 'emergency', label: 'Emergency (24 hours)' },
  ];

  const handleDXFAnalysis = (analysisData) => {
    setDxfData(analysisData);
    setUseManualInput(false);
    
    // Update manual bends based on DXF analysis
    if (analysisData.bendLines) {
      setManualDimensions(prev => ({
        ...prev,
        bends: analysisData.bendLines.length
      }));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'thickness' || name === 'quantity' ? parseFloat(value) : value
    }));
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualDimensions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        ...formData,
        material: formData.material,
      };

      // Add DXF data if available
      if (dxfData && !useManualInput) {
        requestData.dxfData = dxfData;
      } else if (useManualInput) {
        // Add manual dimensions
        requestData.manualLength = parseFloat(manualDimensions.length);
        requestData.manualWidth = parseFloat(manualDimensions.width);
        requestData.manualHoles = parseInt(manualDimensions.holes);
        requestData.manualBends = parseInt(manualDimensions.bends);
      }

      const response = await api.post('/quotes/calculate', requestData);
      setQuote(response.data.quote);
      
      if (onQuoteGenerated) {
        onQuoteGenerated(response.data.quote);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate quote');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!useManualInput && !dxfData) return false;
    if (useManualInput && (!manualDimensions.length || !manualDimensions.width)) return false;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-pine-green">Generate Quote</h2>

      {/* DXF Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Part Design</h3>
        
        <div className="space-y-4">
          {!useManualInput ? (
            <>
              <DXFUploader onAnalysisComplete={handleDXFAnalysis} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseManualInput(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Enter dimensions manually instead
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Length (inches)
                  </label>
                  <input
                    type="number"
                    name="length"
                    value={manualDimensions.length}
                    onChange={handleManualChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Width (inches)
                  </label>
                  <input
                    type="number"
                    name="width"
                    value={manualDimensions.width}
                    onChange={handleManualChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
                    placeholder="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Holes
                  </label>
                  <input
                    type="number"
                    name="holes"
                    value={manualDimensions.holes}
                    onChange={handleManualChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Bends
                  </label>
                  <input
                    type="number"
                    name="bends"
                    value={manualDimensions.bends}
                    onChange={handleManualChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseManualInput(false);
                    setDxfData(null);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Upload DXF file instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Parameters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quote Parameters</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Material
            </label>
            <select
              name="material"
              value={formData.material}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            >
              {materials.map(mat => (
                <option key={mat.value} value={mat.value}>
                  {mat.label} (${mat.pricePerPound}/lb)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thickness
            </label>
            <select
              name="thickness"
              value={formData.thickness}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            >
              {thicknesses.map(thick => (
                <option key={thick.value} value={thick.value}>
                  {thick.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleFormChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Finish
            </label>
            <select
              name="finishType"
              value={formData.finishType}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            >
              {finishes.map(finish => (
                <option key={finish.value} value={finish.value}>
                  {finish.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Urgency
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            >
              {urgencyOptions.map(urgency => (
                <option key={urgency.value} value={urgency.value}>
                  {urgency.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tolerance Level
            </label>
            <select
              name="toleranceLevel"
              value={formData.toleranceLevel}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            >
              <option value="standard">Standard (±0.005")</option>
              <option value="precision">Precision (±0.002")</option>
              <option value="tight">Tight (±0.001")</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pine-green focus:ring-pine-green"
            placeholder="Any special requirements or notes..."
          />
        </div>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <button
          onClick={calculateQuote}
          disabled={loading || !isFormValid()}
          className="px-6 py-3 bg-pine-green text-white rounded-md hover:bg-pine-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate Quote'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Quote Display */}
      {quote && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quote Details</h3>
          
          <div className="space-y-4">
            {/* Pricing Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-xl font-semibold">${quote.pricing.subtotal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total ({quote.pricing.quantity} units)</p>
                  <p className="text-2xl font-bold text-pine-green">${quote.pricing.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Per Unit</p>
                  <p className="text-lg font-semibold">${quote.pricing.perUnit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lead Time</p>
                  <p className="text-lg font-semibold">
                    {formData.urgency === 'emergency' ? '24 hours' : 
                     formData.urgency === 'rush' ? '2-3 days' : '5-7 days'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div>
              <h4 className="font-medium mb-2">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Material ({quote.breakdown.material.weight} lbs)</span>
                  <span>${quote.breakdown.material.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cutting ({quote.breakdown.operations.cutting.length} inches)</span>
                  <span>${quote.breakdown.operations.cutting.cost}</span>
                </div>
                {quote.breakdown.operations.piercing.count > 0 && (
                  <div className="flex justify-between">
                    <span>Piercing ({quote.breakdown.operations.piercing.count} holes)</span>
                    <span>${quote.breakdown.operations.piercing.cost}</span>
                  </div>
                )}
                {quote.breakdown.operations.bending.count > 0 && (
                  <div className="flex justify-between">
                    <span>Bending ({quote.breakdown.operations.bending.count} bends)</span>
                    <span>${quote.breakdown.operations.bending.cost}</span>
                  </div>
                )}
                {quote.breakdown.finishing.cost !== '0.00' && (
                  <div className="flex justify-between">
                    <span>Finish ({quote.breakdown.finishing.type})</span>
                    <span>${quote.breakdown.finishing.cost}</span>
                  </div>
                )}
                {quote.pricing.urgencyMultiplier > 1 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Rush Fee ({((quote.pricing.urgencyMultiplier - 1) * 100).toFixed(0)}%)</span>
                    <span>Included</span>
                  </div>
                )}
              </div>
            </div>

            {/* Measurement Details */}
            <div>
              <h4 className="font-medium mb-2">Part Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Area:</span> {quote.measurements.area} sq ft
                </div>
                <div>
                  <span className="text-gray-600">Cut Length:</span> {quote.measurements.cutLength} inches
                </div>
                <div>
                  <span className="text-gray-600">Complexity:</span> {quote.measurements.complexity}
                </div>
                <div>
                  <span className="text-gray-600">Source:</span> {quote.measurements.source}
                </div>
              </div>
            </div>

            {/* 3D Preview */}
            {quote.previewData && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">3D Preview</h4>
                <DXFViewer dxfData={{ previewData: quote.previewData }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedQuoteForm;
