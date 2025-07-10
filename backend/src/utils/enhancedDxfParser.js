// Enhanced DXF Parser - Fixes area calculation and bend line detection
const DxfParser = require('dxf-parser');
const fs = require('fs').promises;

/**
 * Enhanced DXF Analyzer with better area and bend detection
 */
class EnhancedDXFAnalyzer {
  constructor() {
    this.parser = new DxfParser();
    this.densities = {
      'Cold Rolled Steel': 0.2836,
      'Stainless Steel 304': 0.289,
      'Stainless Steel 316': 0.289,
      'Aluminum 6061': 0.098
    };
  }

  async parse(input) {
    let dxfString;
    
    if (Buffer.isBuffer(input)) {
      dxfString = input.toString('utf8');
    } else if (typeof input === 'string') {
      const buffer = await fs.readFile(input);
      dxfString = buffer.toString('utf8');
    } else {
      throw new Error('Input must be a Buffer or file path');
    }

    try {
      const dxf = this.parser.parseSync(dxfString);
      return this.analyzeDXF(dxf);
    } catch (error) {
      console.error('Error parsing DXF:', error);
      throw new Error(`Failed to parse DXF file: ${error.message}`);
    }
  }

  analyzeDXF(dxf) {
    const result = {
      area: 0,
      perimeter: 0,
      cutLength: 0,
      holeCount: 0,
      holes: [],
      bendLines: [],
      boundingBox: { width: 0, height: 0 },
      complexity: 'simple',
      warnings: [],
      confidence: 'high',
      entities: {
        circles: 0,
        lines: 0,
        polylines: 0,
        arcs: 0
      }
    };

    if (!dxf || !dxf.entities) {
      result.warnings.push('No entities found in DXF file');
      result.confidence = 'low';
      return result;
    }

    // Group entities by type and layer
    const circles = [];
    const polylines = [];
    const lines = [];
    const arcs = [];
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // First pass - categorize entities
    dxf.entities.forEach(entity => {
      switch (entity.type) {
        case 'CIRCLE':
          circles.push(entity);
          result.entities.circles++;
          // Update bounding box
          minX = Math.min(minX, entity.center.x - entity.radius);
          maxX = Math.max(maxX, entity.center.x + entity.radius);
          minY = Math.min(minY, entity.center.y - entity.radius);
          maxY = Math.max(maxY, entity.center.y + entity.radius);
          break;
          
        case 'LWPOLYLINE':
        case 'POLYLINE':
          polylines.push(entity);
          result.entities.polylines++;
          // Update bounding box from vertices
          if (entity.vertices) {
            entity.vertices.forEach(v => {
              minX = Math.min(minX, v.x);
              maxX = Math.max(maxX, v.x);
              minY = Math.min(minY, v.y);
              maxY = Math.max(maxY, v.y);
            });
          }
          break;
          
        case 'LINE':
          lines.push(entity);
          result.entities.lines++;
          // Update bounding box
          if (entity.vertices && entity.vertices.length >= 2) {
            minX = Math.min(minX, entity.vertices[0].x, entity.vertices[1].x);
            maxX = Math.max(maxX, entity.vertices[0].x, entity.vertices[1].x);
            minY = Math.min(minY, entity.vertices[0].y, entity.vertices[1].y);
            maxY = Math.max(maxY, entity.vertices[0].y, entity.vertices[1].y);
          }
          break;
          
        case 'ARC':
          arcs.push(entity);
          result.entities.arcs++;
          break;
      }
    });

    // Calculate bounding box
    if (minX !== Infinity) {
      result.boundingBox.width = maxX - minX;
      result.boundingBox.height = maxY - minY;
    }

    // Find the main outline (largest closed polyline)
    let mainOutline = null;
    let maxArea = 0;
    
    polylines.forEach(polyline => {
      if (polyline.vertices && polyline.vertices.length > 2) {
        // Check if it's on a cutout layer
        const layerName = polyline.layer ? polyline.layer.toLowerCase() : '';
        if (layerName.includes('cutout') || layerName.includes('hole')) {
          // This is a cutout, not the main outline
          return;
        }
        
        const { area } = this.calculatePolylineMetrics(polyline);
        if (Math.abs(area) > maxArea) {
          maxArea = Math.abs(area);
          mainOutline = polyline;
        }
      }
    });

    // Calculate main outline area and perimeter
    if (mainOutline) {
      const metrics = this.calculatePolylineMetrics(mainOutline);
      result.area = Math.abs(metrics.area);
      result.perimeter = metrics.perimeter;
      result.cutLength += metrics.perimeter;
    } else if (result.boundingBox.width > 0 && result.boundingBox.height > 0) {
      // Fallback: use bounding box
      result.area = result.boundingBox.width * result.boundingBox.height;
      result.perimeter = 2 * (result.boundingBox.width + result.boundingBox.height);
      result.warnings.push('Using bounding box for area calculation - no closed outline found');
    }

    // Process cutouts (subtract from main area)
    polylines.forEach(polyline => {
      if (polyline !== mainOutline && polyline.vertices && polyline.vertices.length > 2) {
        const layerName = polyline.layer ? polyline.layer.toLowerCase() : '';
        if (layerName.includes('cutout') || layerName.includes('hole')) {
          const { area, perimeter } = this.calculatePolylineMetrics(polyline);
          result.area -= Math.abs(area);
          result.cutLength += perimeter;
        }
      }
    });

    // Process circles (holes)
    circles.forEach(circle => {
      const diameter = circle.radius * 2;
      
      // Check if it's a hole or main feature based on layer
      const layerName = circle.layer ? circle.layer.toLowerCase() : '';
      const isHole = diameter < 50 || layerName.includes('hole') || !layerName.includes('cutout');
      
      if (isHole) {
        result.holes.push({
          diameter: diameter,
          x: circle.center.x,
          y: circle.center.y
        });
        result.holeCount++;
      } else {
        // Large circle cutout - subtract area
        result.area -= Math.PI * circle.radius * circle.radius;
      }
      
      result.cutLength += Math.PI * diameter; // Add circumference to cut length
    });

    // Process lines (check for bend lines)
    lines.forEach(line => {
      if (this.isBendLine(line, dxf.tables)) {
        const startPoint = line.vertices ? line.vertices[0] : { x: 0, y: 0 };
        const endPoint = line.vertices ? line.vertices[1] : { x: 0, y: 0 };
        const length = this.calculateDistance(startPoint, endPoint);
        
        result.bendLines.push({
          startPoint: { x: startPoint.x, y: startPoint.y },
          endPoint: { x: endPoint.x, y: endPoint.y },
          length: length
        });
      } else {
        // Regular cut line
        if (line.vertices && line.vertices.length >= 2) {
          const length = this.calculateDistance(line.vertices[0], line.vertices[1]);
          result.cutLength += length;
        }
      }
    });

    // Process arcs
    arcs.forEach(arc => {
      if (arc.center && arc.radius && arc.startAngle !== undefined && arc.endAngle !== undefined) {
        const angleSpan = Math.abs(arc.endAngle - arc.startAngle);
        const arcLength = (angleSpan / 180) * Math.PI * arc.radius;
        result.cutLength += arcLength;
      }
    });

    // Determine complexity
    result.complexity = this.determineComplexity(result, polylines.length);

    // Add warnings for manufacturability
    this.checkManufacturability(result, circles);

    // Set confidence based on data quality
    if (result.area === 0 || result.perimeter === 0) {
      result.confidence = 'low';
      if (!result.warnings.some(w => w.includes('area'))) {
        result.warnings.push('Unable to calculate area or perimeter accurately');
      }
    } else if (result.warnings.length > 2) {
      result.confidence = 'medium';
    }

    return result;
  }

  calculatePolylineMetrics(polyline) {
    const vertices = polyline.vertices || polyline.points || [];
    let area = 0;
    let perimeter = 0;

    if (!vertices || vertices.length < 2) {
      return { area: 0, perimeter: 0 };
    }

    // Calculate area using shoelace formula
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    area = Math.abs(area) / 2;

    // Calculate perimeter
    for (let i = 0; i < vertices.length - 1; i++) {
      perimeter += this.calculateDistance(vertices[i], vertices[i + 1]);
    }

    // Add closing segment if polyline is closed
    if (polyline.shape || polyline.closed || this.isPolylineClosed(polyline)) {
      perimeter += this.calculateDistance(vertices[vertices.length - 1], vertices[0]);
    }

    return { area, perimeter };
  }

  isPolylineClosed(polyline) {
    if (polyline.shape || polyline.closed) return true;
    
    const vertices = polyline.vertices || polyline.points || [];
    if (!vertices || vertices.length < 3) return false;
    
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    const distance = this.calculateDistance(first, last);
    
    return distance < 0.001; // Tolerance for closed polyline
  }

  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isBendLine(line, tables) {
    // Check layer name
    if (line.layer) {
      const layerName = line.layer.toLowerCase();
      if (layerName.includes('bend') || 
          layerName.includes('fold') || 
          layerName.includes('crease')) {
        return true;
      }
    }

    // Check color (often bend lines are in specific colors like red/yellow)
    if (line.colorIndex === 1 || line.colorIndex === 2) { // Red or Yellow in AutoCAD
      return true;
    }

    return false;
  }

  determineComplexity(result, polylineCount) {
    let complexityScore = 0;

    // Factor in number of holes
    if (result.holeCount > 10) complexityScore += 2;
    else if (result.holeCount > 5) complexityScore += 1;

    // Factor in number of bends
    if (result.bendLines.length > 4) complexityScore += 2;
    else if (result.bendLines.length > 2) complexityScore += 1;

    // Factor in cut length relative to area
    if (result.area > 0) {
      const perimeterToAreaRatio = result.perimeter / Math.sqrt(result.area);
      if (perimeterToAreaRatio > 8) complexityScore += 2;
      else if (perimeterToAreaRatio > 5) complexityScore += 1;
    }

    // Factor in number of separate polylines
    if (polylineCount > 5) complexityScore += 1;

    // Determine final complexity
    if (complexityScore >= 4) return 'complex';
    else if (complexityScore >= 2) return 'moderate';
    else return 'simple';
  }

  checkManufacturability(result, circles) {
    // Check for very small holes
    circles.forEach(circle => {
      if (circle.radius < 0.0625) { // Less than 1/8 inch diameter
        result.warnings.push(`Very small hole detected (${(circle.radius * 2).toFixed(3)}" diameter) - may require special tooling`);
      }
    });

    // Check for very small features
    if (result.boundingBox.width < 1 || result.boundingBox.height < 1) {
      result.warnings.push('Part dimensions are very small - verify scale');
    }

    // Check aspect ratio
    const aspectRatio = Math.max(result.boundingBox.width, result.boundingBox.height) / 
                       Math.min(result.boundingBox.width, result.boundingBox.height);
    if (aspectRatio > 10) {
      result.warnings.push('Part has extreme aspect ratio - may be difficult to handle');
    }
  }

  calculateWeight(area, thickness, material) {
    const density = this.densities[material];
    if (!density) {
      throw new Error(`Unknown material: ${material}`);
    }
    
    const volume = area * thickness; // cubic inches
    return volume * density; // pounds
  }
}

module.exports = new EnhancedDXFAnalyzer();
