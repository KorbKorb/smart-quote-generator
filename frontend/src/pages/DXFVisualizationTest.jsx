import React, { useState, useRef } from 'react';
import { DXFUploader } from '../components/DXF/DXFUploader';
import Enhanced3DViewer from '../components/DXF/Enhanced3DViewer';
import api from '../utils/api';

const DXFVisualizationTest = () => {
  const [dxfData, setDxfData] = useState(null);
  const [material, setMaterial] = useState('cold-rolled-steel');
  const [thickness, setThickness] = useState(0.125);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const fileInputRef = useRef(null);

  const materials = [
    { value: 'cold-rolled-steel', label: 'Cold Rolled Steel' },
    { value: 'stainless-304', label: 'Stainless Steel 304' },
    { value: 'stainless-316', label: 'Stainless Steel 316' },
    { value: 'aluminum-6061', label: 'Aluminum 6061' },
  ];

  const thicknesses = [
    { value: 0.0625, label: '1/16"' },
    { value: 0.125, label: '1/8"' },
    { value: 0.1875, label: '3/16"' },
    { value: 0.25, label: '1/4"' },
    { value: 0.375, label: '3/8"' },
    { value: 0.5, label: '1/2"' },
  ];

  const handleDXFAnalysis = (analysisData) => {
    console.log('DXF Analysis Complete:', analysisData);
    setDxfData(analysisData);
    setError(null);
    setQuote(null);
  };

  const handleSampleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to backend for analysis
      const response = await api.post('/quotes/analyze-dxf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const data = response.data.data;
        console.log('Analysis successful:', data);
        setDxfData(data);
        setQuote(null);
      } else {
        throw new Error(response.data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError(err.response?.data?.message || err.message || 'Failed to analyze file');
    } finally {
      setLoading(false);
    }
  };

  const calculateQuote = async () => {
    if (!dxfData) return;
    
    setLoading(true);
    try {
      const response = await api.post('/quotes/calculate', {
        material,
        thickness,
        quantity: 1,
        finishType: 'none',
        urgency: 'standard',
        dxfData
      });
      
      setQuote(response.data.quote);
    } catch (err) {
      setError('Failed to calculate quote');
    } finally {
      setLoading(false);
    }
  };

  // Create mock data for testing 3D viewer
  const loadMockData = () => {
    const mockData = {
      area: 5000,
      perimeter: 300,
      cutLength: 350,
      holeCount: 6,
      holes: [
        { x: 50, y: 50, diameter: 10 },
        { x: 250, y: 50, diameter: 10 },
        { x: 50, y: 150, diameter: 10 },
        { x: 250, y: 150, diameter: 10 },
        { x: 150, y: 100, diameter: 20 },
        { x: 150, y: 200, diameter: 15 }
      ],
      bendLines: [
        { startPoint: { x: 0, y: 100 }, endPoint: { x: 300, y: 100 } },
        { startPoint: { x: 150, y: 0 }, endPoint: { x: 150, y: 250 } }
      ],
      boundingBox: { 
        width: 300,
        height: 250 
      },
      complexity: 'moderate',
      entities: {
        circles: 6,
        lines: 8,
        polylines: 1,
        arcs: 0
      },
      warnings: []
    };
    
    setDxfData(mockData);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">DXF Parser & 3D Visualization Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Controls */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload DXF File</h2>
              <DXFUploader onAnalysisComplete={handleDXFAnalysis} />
            </div>

            {/* Sample Files */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Load Test Files</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Navigate to the test-files directory and select one of:
                  chassis-panel.dxf, enclosure-flat.dxf, complex-bracket.dxf, or circular-flange.dxf
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dxf"
                  onChange={handleSampleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button
                  onClick={loadMockData}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Load Mock Data (For 3D Testing)
                </button>
              </div>
            </div>

            {/* Material Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Material & Thickness</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {materials.map(mat => (
                      <option key={mat.value} value={mat.value}>
                        {mat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thickness
                  </label>
                  <select
                    value={thickness}
                    onChange={(e) => setThickness(parseFloat(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {thicknesses.map(thick => (
                      <option key={thick.value} value={thick.value}>
                        {thick.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={calculateQuote}
                disabled={!dxfData || loading}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calculate Quote
              </button>
            </div>

            {/* DXF Data Display */}
            {dxfData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">DXF Analysis Data</h2>
                <div className="space-y-2 text-sm">
                  <div><strong>Area:</strong> {(dxfData.area / 144).toFixed(2)} sq ft</div>
                  <div><strong>Perimeter:</strong> {dxfData.perimeter?.toFixed(2)} in</div>
                  <div><strong>Cut Length:</strong> {dxfData.cutLength?.toFixed(2)} in</div>
                  <div><strong>Holes:</strong> {dxfData.holeCount}</div>
                  <div><strong>Bends:</strong> {dxfData.bendLines?.length || 0}</div>
                  <div><strong>Complexity:</strong> {dxfData.complexity}</div>
                  {dxfData.warnings?.length > 0 && (
                    <div>
                      <strong className="text-amber-600">Warnings:</strong>
                      <ul className="list-disc list-inside">
                        {dxfData.warnings.map((w, i) => (
                          <li key={i} className="text-amber-600">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quote Display */}
            {quote && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Quote Result</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Material Cost:</span>
                    <span>${quote.breakdown.material.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cutting Cost:</span>
                    <span>${quote.breakdown.operations.cutting.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Piercing Cost:</span>
                    <span>${quote.breakdown.operations.piercing.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Bending Cost:</span>
                    <span>${quote.breakdown.operations.bending.cost}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">${quote.pricing.total}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - 3D Viewer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">3D Visualization</h2>
            {dxfData ? (
              <Enhanced3DViewer 
                dxfData={dxfData} 
                material={material}
                thickness={thickness}
              />
            ) : (
              <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500">Upload a DXF file or load mock data to see 3D visualization</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DXFVisualizationTest;
