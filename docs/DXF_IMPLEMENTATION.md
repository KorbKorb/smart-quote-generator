# DXF Parser Implementation Guide

## Overview

The Smart Quote Generator now includes full DXF (Drawing Exchange Format) file parsing capabilities. This allows users to upload CAD drawings and automatically extract manufacturing data for accurate quoting.

## Features

### 1. **DXF File Analysis**
- **Area Calculation**: Automatically calculates the area of closed polylines
- **Cut Length**: Measures total cutting distance including lines, arcs, and polylines
- **Hole Detection**: Identifies circles as holes and counts them
- **Bend Line Detection**: Recognizes bend lines by layer name or color
- **Complexity Assessment**: Determines part complexity based on features
- **Manufacturability Warnings**: Alerts for small holes, close spacing, etc.

### 2. **3D Visualization**
- Real-time 3D preview using Three.js
- Interactive controls (zoom, pan, rotate)
- Visual representation of holes and cut paths
- Grid background for scale reference

### 3. **Dual Input Modes**
- **DXF Upload**: Automatic extraction of all measurements
- **Manual Entry**: Fallback option with length, width, holes, and bends

## Technical Implementation

### Backend Components

#### DXF Parser Service (`backend/src/utils/dxfParser.js`)
```javascript
const dxfParser = require('./dxfParser');

// Parse a DXF file
const analysis = await dxfParser.parse(filePath);

// Returns:
{
  area: 5000,              // Square units
  perimeter: 300,          // Linear units
  cutLength: 350,          // Total cut length
  holeCount: 4,            // Number of holes
  holes: [...],            // Hole details
  bendLines: [...],        // Bend line details
  boundingBox: {...},      // Part dimensions
  complexity: 'moderate',  // simple/moderate/complex
  warnings: [...],         // Manufacturing warnings
  previewData: {...}       // 3D visualization data
}
```

#### Quote Routes (`backend/src/routes/quotes.js`)
- `POST /api/quotes/analyze-dxf` - Analyzes uploaded DXF file
- `POST /api/quotes/calculate` - Calculates quote with optional DXF data

### Frontend Components

#### DXF Uploader (`frontend/src/components/DXF/DXFUploader.jsx`)
- Drag-and-drop file upload interface
- Real-time analysis display
- 3D preview integration

#### Enhanced Quote Form (`frontend/src/components/QuoteForm/EnhancedQuoteForm.jsx`)
- Integrated DXF upload
- Manual dimension fallback
- Real-time quote calculation
- Detailed cost breakdown

## Usage Guide

### 1. **Uploading a DXF File**

```javascript
// Frontend usage
import { DXFUploader } from './components/DXF/DXFUploader';

<DXFUploader 
  onAnalysisComplete={(data) => {
    console.log('DXF Analysis:', data);
  }}
/>
```

### 2. **Testing the Implementation**

Run the test scripts:

```bash
# Generate sample DXF files
node scripts/generate-sample-dxf.js

# Test DXF parsing functionality
node scripts/test-dxf-functionality.js
```

### 3. **Quote Calculation with DXF Data**

```javascript
// API request format
POST /api/quotes/calculate
{
  "material": "cold-rolled-steel",
  "thickness": 0.125,
  "quantity": 10,
  "finishType": "powder-coat",
  "urgency": "standard",
  "dxfData": {
    // Analysis data from DXF parser
  }
}
```

## DXF File Requirements

### Supported Entities
- **LWPOLYLINE/POLYLINE**: For part outlines
- **CIRCLE**: Interpreted as holes
- **LINE**: For straight cuts or bend lines
- **ARC**: For curved cuts

### Best Practices
1. **Closed Polylines**: Ensure part outlines are closed for accurate area calculation
2. **Bend Lines**: Place on layer named "BEND" or color them red (1) or yellow (2)
3. **Units**: File should be in consistent units (inches recommended)
4. **Clean Geometry**: Remove construction lines and unnecessary entities

## Cost Calculation Logic

### Material Cost
```
Weight = Area × Thickness × Material Density
Material Cost = Weight × Price per Pound
```

### Operation Costs
- **Cutting**: $0.10 per inch (varies by material/thickness)
- **Piercing**: $0.50 per hole
- **Bending**: $5.00 per bend + setup

### Modifiers
- **Complexity**: Simple (1.0x), Moderate (1.15x), Complex (1.35x)
- **Tolerance**: Standard (1.0x), Precision (1.25x), Tight (1.5x)
- **Urgency**: Standard (1.0x), Rush (1.25x), Emergency (1.5x)

## Troubleshooting

### Common Issues

1. **"No entities found in DXF file"**
   - Check if file is a valid DXF format
   - Ensure file contains geometry entities

2. **"Unable to calculate area"**
   - Verify polylines are properly closed
   - Check for self-intersecting geometry

3. **Bend lines not detected**
   - Place bend lines on "BEND" layer
   - Use color codes 1 (red) or 2 (yellow)

### Debug Mode

Enable detailed logging:
```javascript
// In dxfParser.js
console.log('DXF Entities:', dxf.entities);
console.log('Analysis Result:', result);
```

## Sample DXF Files

Located in `/test-files/`:
- `simple-rectangle.dxf` - Basic shape with 2 holes
- `l-bracket.dxf` - L-shaped part with bend
- `enclosure-panel.dxf` - Complex panel with multiple features
- `circular-flange.dxf` - Circular part with bolt pattern

## Future Enhancements

1. **Additional File Formats**: Support for DWG, STEP, IGES
2. **Nested Parts**: Optimize material usage for multiple parts
3. **Assembly Detection**: Quote multi-part assemblies
4. **Material Optimization**: Suggest cost-saving alternatives
5. **PDF Report Generation**: Include DXF preview in quotes

## API Reference

### Analyze DXF Endpoint
```
POST /api/quotes/analyze-dxf
Content-Type: multipart/form-data

Parameters:
- file: DXF file (required)

Response:
{
  "success": true,
  "data": {
    "area": 1440,
    "perimeter": 160,
    "cutLength": 180,
    "holeCount": 4,
    "bendLines": [],
    "complexity": "simple",
    "warnings": [],
    "previewData": {...}
  }
}
```

### Calculate Quote Endpoint
```
POST /api/quotes/calculate
Content-Type: application/json

Body:
{
  "material": "cold-rolled-steel",
  "thickness": 0.125,
  "quantity": 10,
  "finishType": "powder-coat",
  "urgency": "standard",
  "toleranceLevel": "standard",
  "dxfData": {...} // Optional
}

Response:
{
  "quote": {
    "pricing": {...},
    "breakdown": {...},
    "measurements": {...},
    "previewData": {...}
  }
}
```

## Performance Considerations

- **File Size**: Optimize for files under 10MB
- **Entity Count**: Best performance with < 10,000 entities
- **Caching**: Consider caching parsed DXF data
- **3D Rendering**: Limit preview to essential geometry

## Security Notes

- Files are temporarily stored during processing
- Automatic cleanup after analysis
- File type validation (only .dxf allowed)
- Size limits enforced by multer middleware
