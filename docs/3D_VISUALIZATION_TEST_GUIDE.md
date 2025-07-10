# DXF 3D Visualization Testing Guide

## Quick Start

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The server should start on port 3002.

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend should start on port 3000.

3. **Navigate to the Test Page**
   Go to: http://localhost:3000/admin/dxf-3d-test

## Testing Steps

### Option 1: Test with Mock Data (Quickest)
1. Click the **"Load Mock Data (For 3D Testing)"** button
2. This will load sample data with holes and bend lines
3. The 3D viewer should display immediately
4. Try the view controls:
   - 3D View / Flat View / Wireframe
   - Toggle dimensions and bend lines
   - Change material to see color changes

### Option 2: Test with Real DXF Files
1. Use the file input or DXF uploader
2. Navigate to the `test-files` directory and select one of:
   - `chassis-panel.dxf` - A basic chassis panel with mounting holes
   - `enclosure-flat.dxf` - An enclosure with 4 bend lines
   - `complex-bracket.dxf` - A more complex bracket shape
   - `circular-flange.dxf` - A circular part with bolt holes

### Option 3: Upload Your Own DXF
1. Use the DXF uploader component
2. Drag and drop any DXF file
3. The file will be analyzed by the backend
4. 3D visualization will appear automatically

## Features to Test

1. **View Modes**
   - 3D View: Full 3D perspective with rotation
   - Flat View: Top-down 2D view
   - Wireframe: See through the model

2. **Visual Options**
   - Show/Hide Dimensions
   - Show/Hide Bend Lines (red dashed lines)
   - Material selection (changes color)

3. **Interaction**
   - Mouse drag to rotate
   - Scroll to zoom
   - Right-click drag to pan

4. **Quote Calculation**
   - After loading a DXF, click "Calculate Quote"
   - See the breakdown of costs

## Expected Results

- The 3D viewer should render a sheet metal part
- Holes should appear as circular cutouts
- Bend lines should show as red dashed lines
- Material changes should update the part color
- The info panel should show accurate measurements

## Troubleshooting

1. **"Failed to analyze file"**
   - Check that the backend is running on port 3002
   - Verify the DXF file is valid
   - Check backend logs for errors

2. **3D Viewer is blank**
   - Open browser console for errors
   - Check if DXF data is being passed correctly
   - Try the mock data button first

3. **Three.js errors**
   - Make sure all Three.js imports are correct
   - Check for missing dependencies

## Console Debugging

Open the browser console to see:
- DXF analysis results
- 3D viewer data structure
- Any JavaScript errors

The page logs important data to help debug issues.
