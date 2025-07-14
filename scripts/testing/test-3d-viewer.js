const fs = require('fs').promises;
const path = require('path');
const DxfParser = require('dxf-parser');

async function testEnhanced3DViewer() {
  try {
    const parser = new DxfParser();
    
    // Test with chassis-panel.dxf
    const dxfPath = path.join(__dirname, '../test-files/chassis-panel.dxf');
    const dxfContent = await fs.readFile(dxfPath, 'utf-8');
    
    const dxf = parser.parseSync(dxfContent);
    
    console.log('=== DXF Structure for 3D Viewer ===');
    console.log('Entities:', {
      CIRCLE: dxf.entities.filter(e => e.type === 'CIRCLE').length,
      LINE: dxf.entities.filter(e => e.type === 'LINE').length,
      LWPOLYLINE: dxf.entities.filter(e => e.type === 'LWPOLYLINE').length,
      ARC: dxf.entities.filter(e => e.type === 'ARC').length
    });
    
    // Extract data needed for 3D viewer
    const viewerData = {
      area: 0,
      perimeter: 0,
      cutLength: 0,
      holeCount: 0,
      holes: [],
      bendLines: [],
      boundingBox: { width: 0, height: 0 },
      complexity: 'moderate',
      entities: {},
      warnings: []
    };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    // Process entities
    dxf.entities.forEach(entity => {
      switch (entity.type) {
        case 'CIRCLE':
          viewerData.holes.push({
            x: entity.center.x,
            y: entity.center.y,
            diameter: entity.radius * 2
          });
          viewerData.holeCount++;
          
          // Update bounding box
          minX = Math.min(minX, entity.center.x - entity.radius);
          maxX = Math.max(maxX, entity.center.x + entity.radius);
          minY = Math.min(minY, entity.center.y - entity.radius);
          maxY = Math.max(maxY, entity.center.y + entity.radius);
          break;
          
        case 'LINE':
          if (entity.layer === 'BEND') {
            viewerData.bendLines.push({
              startPoint: { x: entity.vertices[0].x, y: entity.vertices[0].y },
              endPoint: { x: entity.vertices[1].x, y: entity.vertices[1].y }
            });
          }
          
          // Update bounding box
          entity.vertices.forEach(v => {
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
          });
          break;
          
        case 'LWPOLYLINE':
          // Update bounding box
          entity.vertices.forEach(v => {
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
          });
          break;
      }
    });
    
    viewerData.boundingBox = {
      width: maxX - minX,
      height: maxY - minY
    };
    
    // Calculate area (simplified)
    viewerData.area = viewerData.boundingBox.width * viewerData.boundingBox.height;
    viewerData.perimeter = 2 * (viewerData.boundingBox.width + viewerData.boundingBox.height);
    viewerData.cutLength = viewerData.perimeter + (viewerData.holeCount * Math.PI * 10); // Assuming 10mm dia holes
    
    viewerData.entities = {
      circles: viewerData.holeCount,
      lines: dxf.entities.filter(e => e.type === 'LINE').length,
      polylines: dxf.entities.filter(e => e.type === 'LWPOLYLINE').length,
      arcs: dxf.entities.filter(e => e.type === 'ARC').length
    };
    
    console.log('\n=== Data for Enhanced3DViewer ===');
    console.log(JSON.stringify(viewerData, null, 2));
    
    // Save the viewer data for easy testing
    await fs.writeFile(
      path.join(__dirname, '../test-files/chassis-panel-viewer-data.json'),
      JSON.stringify(viewerData, null, 2)
    );
    
    console.log('\n✅ Viewer data saved to test-files/chassis-panel-viewer-data.json');
    console.log('You can now test the Enhanced3DViewer with this data!');
    
  } catch (error) {
    console.error('Error testing 3D viewer:', error);
  }
}

testEnhanced3DViewer();
