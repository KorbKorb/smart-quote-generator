# DXF 3D Viewer Documentation

## Overview
The DXFViewer3D component provides an interactive 3D visualization of DXF files using Three.js. It converts 2D DXF data into 3D geometry with proper highlighting for different features.

## Features

### 1. **3D Visualization**
- Converts 2D DXF outlines to extruded 3D geometry
- Shows material thickness (0.125" default)
- Beveled edges for realistic appearance
- Semi-transparent material for better visibility

### 2. **Interactive Controls**
- **Rotation**: Left-click and drag
- **Pan**: Right-click and drag (or Ctrl + left-click)
- **Zoom**: Mouse wheel or pinch gesture
- **Reset View**: Button to return to default view
- **Wireframe Toggle**: Switch between solid and wireframe view

### 3. **Feature Highlighting**
- **Outlines**: Dark gray (main part edges)
- **Holes**: Red circles with 3D cylinders
- **Bend Lines**: Blue dashed lines
- **Hover Effects**: Shows dimensions on hover

### 4. **Mobile Support**
- Touch controls enabled
- One finger: Rotate
- Two fingers: Zoom and pan
- Responsive design

### 5. **Information Display**
- Part dimensions (width × height)
- Total area
- Legend for feature colors
- Dimension tooltips on hover

## Component Props

```typescript
interface DXFViewer3DProps {
  dxfData: {
    area: number;
    perimeter: number;
    cutLength: number;
    holeCount: number;
    holes: Array<{
      diameter: number;
      x: number;
      y: number;
    }>;
    bendLines: Array<{
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
      length: number;
    }>;
    boundingBox: {
      width: number;
      height: number;
    };
    complexity: 'simple' | 'moderate' | 'complex';
    warnings: string[];
    confidence: 'high' | 'medium' | 'low';
    entities?: any; // Optional: Raw DXF entities
  };
  width?: string; // Default: '100%'
  height?: string; // Default: '400px'
}
```

## Usage

### Basic Usage
```jsx
import DXFViewer3D from './components/DXFViewer3D';

function MyComponent({ dxfData }) {
  return (
    <DXFViewer3D 
      dxfData={dxfData} 
      height="500px" 
    />
  );
}
```

### With Quote Form Integration
```jsx
{dxfData && (
  <div className="dxf-viewer-section">
    <DXFViewer3D dxfData={dxfData} height="500px" />
  </div>
)}
```

## Architecture

### 1. **Main Component** (`DXFViewer3D.jsx`)
- Sets up Three.js scene, camera, renderer
- Manages OrbitControls for interaction
- Handles hover detection with Raycaster
- Renders UI controls and information

### 2. **DXF to 3D Converter** (`dxfTo3D.js`)
- Converts DXF entities to Three.js geometry
- Handles different entity types (circles, lines, polylines, arcs)
- Creates extruded shapes with holes
- Manages materials and colors

### 3. **Styling** (`DXFViewer3D.css`)
- Glass morphism design
- Responsive layout
- Animation effects
- Dark mode support

## Three.js Implementation Details

### Scene Setup
```javascript
- Scene background: Light gray (#f5f5f5)
- Camera: PerspectiveCamera (FOV: 75°)
- Renderer: WebGLRenderer with antialiasing
- Lights: AmbientLight + DirectionalLight
- Helpers: GridHelper + AxesHelper
```

### Materials
```javascript
- Part: MeshPhongMaterial (gray, semi-transparent)
- Outline: LineBasicMaterial (dark gray)
- Holes: LineBasicMaterial (red) + MeshPhongMaterial
- Bends: LineDashedMaterial (blue)
```

### Performance Optimizations
- Dispose of geometries and materials on unmount
- Use BufferGeometry for efficiency
- Limit circle segments to 32
- Enable damping on controls

## Advanced Features

### 1. **Entity Support**
The viewer can handle both simplified DXF data and raw DXF entities:
- Automatically detects entity types
- Processes LWPOLYLINE, CIRCLE, LINE, ARC
- Groups entities by type for organization

### 2. **Smart Feature Detection**
- Identifies bend lines by layer name or color
- Finds largest closed polyline as main outline
- Detects holes inside the main shape
- Calculates area using shoelace formula

### 3. **Error Handling**
- Graceful fallback for invalid data
- Loading states during initialization
- Error messages for failed renders

## Customization

### Modify Materials
```javascript
// In dxfTo3D.js
this.materials = {
  part: new THREE.MeshPhongMaterial({ 
    color: 0xe0e0e0, // Change part color
    opacity: 0.8     // Adjust transparency
  })
};
```

### Change Extrusion Depth
```javascript
// In dxfTo3D.js
const extrudeSettings = {
  depth: 0.125, // Change thickness visualization
  bevelEnabled: true,
};
```

### Adjust Camera Position
```javascript
// In DXFViewer3D.jsx
camera.position.set(
  0,   // X position
  50,  // Y position (height)
  100  // Z position (distance)
);
```

## Troubleshooting

### Common Issues

1. **DXF not displaying**
   - Check if dxfData prop is properly formatted
   - Verify entities array exists if using raw DXF data
   - Check console for WebGL errors

2. **Performance issues**
   - Reduce circle segments in dxfTo3D.js
   - Disable grid/axes helpers
   - Simplify complex polylines

3. **Mobile touch not working**
   - Ensure OrbitControls has enableTouchRotate enabled
   - Check if container has proper touch event handlers

### Debug Mode
Enable debug logs by adding to DXFViewer3D.jsx:
```javascript
const DEBUG = true;
if (DEBUG) console.log('DXF Data:', dxfData);
```

## Future Enhancements

1. **Export Features**
   - Export 3D view as image
   - Save camera position
   - Export to STL/OBJ

2. **Advanced Visualization**
   - Material texture options
   - Shadow rendering
   - Measurement tools

3. **Performance**
   - Level-of-detail (LOD) for complex parts
   - Web Worker processing
   - GPU instancing for repeated features