// backend/src/utils/dxfParser.js

const DxfParser = require('dxf-parser');
const fs = require('fs').promises;

/**
 * Parse DXF file and extract manufacturing data
 */
class DXFAnalyzer {
  constructor() {
    this.parser = new DxfParser();
    this.densities = {
      'Cold Rolled Steel': 0.2836,
      'Stainless Steel 304': 0.289,
      'Stainless Steel 316': 0.289,
      'Aluminum 6061': 0.098
    };
  }

  /**
   * Parse DXF file from buffer or file path
   */
  async parse(input) {
    let dxfString;
    
    if (Buffer.isBuffer(input)) {
      dxfString = input.toString('utf8');
    } else if (typeof input === 'string') {
      // Assume it's a file path
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

  /**
   * Analyze parsed DXF data and extract manufacturing information
   */
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

    // Extract all entities
    const circles = [];
    const polylines = [];
    const lines = [];
    const arcs = [];
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Process entities
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
          if (entity.start && entity.end) {
            minX = Math.min(minX, entity.start.x, entity.end.x);
            maxX = Math.max(maxX, entity.start.x, entity.end.x);
            minY = Math.min(minY, entity.start.y, entity.end.y);
            maxY = Math.max(maxY, entity.start.y, entity.end.y);
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

    // Process circles (holes)
    circles.forEach(circle => {
      const diameter = circle.radius * 2;
      result.holes.push({
        diameter: diameter,
        x: circle.center.x,
        y: circle.center.y
      });
      result.holeCount++;
      result.cutLength += Math.PI * diameter; // Add circumference to cut length
    });

    // Process polylines (main outline and features)
    polylines.forEach(polyline => {
      if (polyline.vertices && polyline.vertices.length > 1) {
        const { area, perimeter } = this.calculatePolylineMetrics(polyline);
        
        // Only add area if polyline is closed
        if (polyline.closed || this.isPolylineClosed(polyline)) {
          result.area += Math.abs(area);
        }
        
        result.perimeter += perimeter;
        result.cutLength += perimeter;
      }
    });

    // Process lines (could be bend lines or cut lines)
    lines.forEach(line => {
      if (line.start && line.end) {
        const length = this.calculateDistance(line.start, line.end);
        
        // Check if line is on a bend layer
        if (this.isBendLine(line, dxf.tables)) {
          result.bendLines.push({
            startPoint: { x: line.start.x, y: line.start.y },
            endPoint: { x: line.end.x, y: line.end.y },
            length: length
          });
        } else {
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
      result.warnings.push('Unable to calculate area or perimeter - check if drawing is properly closed');
    } else if (result.warnings.length > 2) {
      result.confidence = 'medium';
    }

    return result;
  }

  /**
   * Calculate area and perimeter for a polyline using shoelace formula
   */
  calculatePolylineMetrics(polyline) {
    const vertices = polyline.vertices;
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
    if (polyline.closed || this.isPolylineClosed(polyline)) {
      perimeter += this.calculateDistance(vertices[vertices.length - 1], vertices[0]);
    }

    return { area, perimeter };
  }

  /**
   * Check if polyline is effectively closed
   */
  isPolylineClosed(polyline) {
    if (polyline.closed) return true;
    
    const vertices = polyline.vertices;
    if (!vertices || vertices.length < 3) return false;
    
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    const distance = this.calculateDistance(first, last);
    
    return distance < 0.001; // Tolerance for closed polyline
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a line is a bend line based on layer or color
   */
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
    if (line.color === 1 || line.color === 2) { // Red or Yellow in AutoCAD
      return true;
    }

    return false;
  }

  /**
   * Determine part complexity based on features
   */
  determineComplexity(result, polylineCount) {
    let complexityScore = 0;

    // Factor in number of holes
    if (result.holeCount > 10) complexityScore += 2;
    else if (result.holeCount > 5) complexityScore += 1;

    // Factor in number of bends
    if (result.bendLines.length > 4) complexityScore += 2;
    else if (result.bendLines.length > 2) complexityScore += 1;

    // Factor in cut length relative to area
    const perimeterToAreaRatio = result.perimeter / Math.sqrt(result.area);
    if (perimeterToAreaRatio > 8) complexityScore += 2;
    else if (perimeterToAreaRatio > 5) complexityScore += 1;

    // Factor in number of separate polylines
    if (polylineCount > 5) complexityScore += 1;

    // Determine final complexity
    if (complexityScore >= 4) return 'complex';
    else if (complexityScore >= 2) return 'moderate';
    else return 'simple';
  }

  /**
   * Check manufacturability and add warnings
   */
  checkManufacturability(result, circles) {
    // Check for very small holes
    circles.forEach(circle => {
      if (circle.radius < 0.125) { // Less than 1/8 inch diameter
        result.warnings.push(`Small hole detected (${(circle.radius * 2).toFixed(3)}" diameter) - may require special tooling`);
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

    // Check for closely spaced holes
    if (circles.length > 1) {
      for (let i = 0; i < circles.length - 1; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const distance = this.calculateDistance(circles[i].center, circles[j].center);
          const minSpacing = (circles[i].radius + circles[j].radius) * 1.5;
          if (distance < minSpacing) {
            result.warnings.push('Holes are very close together - may affect material integrity');
            break;
          }
        }
      }
    }
  }

  /**
   * Calculate material weight based on area, thickness, and material
   */
  calculateWeight(area, thickness, material) {
    const density = this.densities[material];
    if (!density) {
      throw new Error(`Unknown material: ${material}`);
    }
    
    const volume = area * thickness; // cubic inches
    return volume * density; // pounds
  }
}

module.exports = new DXFAnalyzer();
