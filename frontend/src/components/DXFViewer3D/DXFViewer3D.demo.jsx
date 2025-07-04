// frontend/src/components/DXFViewer3D/DXFViewer3D.demo.jsx
import React, { useState } from 'react';
import DXFViewer3D from './DXFViewer3D';

// Demo component showing different DXF examples
const DXFViewer3DDemo = () => {
  const [selectedExample, setSelectedExample] = useState('simple');

  // Example DXF data
  const examples = {
    simple: {
      area: 100,
      perimeter: 40,
      cutLength: 40,
      holeCount: 0,
      holes: [],
      bendLines: [],
      boundingBox: { width: 10, height: 10 },
      complexity: 'simple',
      warnings: [],
      confidence: 'high'
    },
    withHoles: {
      area: 144,
      perimeter: 48,
      cutLength: 60.85,
      holeCount: 4,
      holes: [
        { diameter: 1.0, x: 3, y: 3 },
        { diameter: 1.0, x: 9, y: 3 },
        { diameter: 1.0, x: 9, y: 9 },
        { diameter: 1.0, x: 3, y: 9 }
      ],
      bendLines: [],
      boundingBox: { width: 12, height: 12 },
      complexity: 'moderate',
      warnings: [],
      confidence: 'high'
    },
    withBends: {
      area: 200,
      perimeter: 60,
      cutLength: 60,
      holeCount: 0,
      holes: [],
      bendLines: [
        { startPoint: { x: 0, y: 5 }, endPoint: { x: 20, y: 5 }, length: 20 },
        { startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 }, length: 10 }
      ],
      boundingBox: { width: 20, height: 10 },
      complexity: 'moderate',
      warnings: [],
      confidence: 'high'
    },
    complex: {
      area: 180,
      perimeter: 70,
      cutLength: 95.7,
      holeCount: 8,
      holes: [
        { diameter: 0.5, x: 2, y: 2 },
        { diameter: 0.5, x: 5, y: 2 },
        { diameter: 0.5, x: 8, y: 2 },
        { diameter: 0.5, x: 11, y: 2 },
        { diameter: 0.75, x: 3.5, y: 5 },
        { diameter: 0.75, x: 8.5, y: 5 },
        { diameter: 1.0, x: 6, y: 8 },
        { diameter: 0.125, x: 12, y: 8 }
      ],
      bendLines: [
        { startPoint: { x: 0, y: 4 }, endPoint: { x: 15, y: 4 }, length: 15 },
        { startPoint: { x: 0, y: 7 }, endPoint: { x: 15, y: 7 }, length: 15 },
        { startPoint: { x: 5, y: 0 }, endPoint: { x: 5, y: 10 }, length: 10 },
        { startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 }, length: 10 }
      ],
      boundingBox: { width: 15, height: 10 },
      complexity: 'complex',
      warnings: ['Small hole detected (0.125" diameter) - may require special tooling'],
      confidence: 'high'
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>DXF Viewer 3D Demo</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="example-select" style={{ marginRight: '1rem' }}>
          Select Example:
        </label>
        <select 
          id="example-select"
          value={selectedExample} 
          onChange={(e) => setSelectedExample(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="simple">Simple Rectangle</option>
          <option value="withHoles">Rectangle with Holes</option>
          <option value="withBends">Part with Bend Lines</option>
          <option value="complex">Complex Part</option>
        </select>
      </div>

      <DXFViewer3D dxfData={examples[selectedExample]} height="600px" />

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✓ 3D visualization with extruded geometry</li>
          <li>✓ Rotation, zoom, and pan controls (OrbitControls)</li>
          <li>✓ Holes highlighted in red</li>
          <li>✓ Bend lines shown as blue dashed lines</li>
          <li>✓ Hover to see dimensions</li>
          <li>✓ Reset view button</li>
          <li>✓ Wireframe toggle</li>
          <li>✓ Touch controls for mobile devices</li>
          <li>✓ Part dimensions display</li>
          <li>✓ Color-coded legend</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
        <h4>Controls:</h4>
        <p><strong>Desktop:</strong> Left click + drag to rotate, right click + drag to pan, scroll to zoom</p>
        <p><strong>Mobile:</strong> One finger to rotate, two fingers to zoom/pan</p>
      </div>
    </div>
  );
};

export default DXFViewer3DDemo;
