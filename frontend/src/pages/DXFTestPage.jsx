import React from 'react';
import EnhancedQuoteForm from '../components/QuoteForm/EnhancedQuoteForm';

const DXFTestPage = () => {
  const handleQuoteGenerated = (quote) => {
    console.log('Quote generated:', quote);
    // Could save to state, redirect, or show success message
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-pine-green mb-2">
              Smart Quote Generator - DXF Test
            </h1>
            <p className="text-gray-600">
              Upload a DXF file or enter dimensions manually to generate an instant quote
            </p>
          </div>

          <EnhancedQuoteForm onQuoteGenerated={handleQuoteGenerated} />

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Sample DXF Files Available</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>You can test with these sample files in the test-files directory:</p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>simple-rectangle.dxf</strong> - Basic rectangle with 2 holes</li>
                <li><strong>l-bracket.dxf</strong> - L-shaped bracket with 3 holes and 1 bend</li>
                <li><strong>enclosure-panel.dxf</strong> - Complex panel with 10 holes and 2 bends</li>
                <li><strong>circular-flange.dxf</strong> - Circular part with 6 bolt holes</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The DXF parser extracts cut length, hole count, and area automatically. 
                Bend lines should be on a layer named "BEND" or colored red/yellow to be detected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DXFTestPage;
