import DxfParser from 'dxf-parser';
import _ from 'lodash';
import * as math from 'mathjs';

export class SheetMetalFeatureDetector {
  constructor() {
    this.geometryProcessor = new GeometryProcessor();
    this.featureDetectors = {
      holes: new HoleDetector(),
      bends: new BendDetector(),
      cutouts: new CutoutDetector(),
      slots: new SlotDetector()
    };
    // Note: We'll add ML features later when TensorFlow is properly installed
    this.useML = false;
  }

  async analyzeCADFile(fileBuffer, fileName) {
    try {
      const fileType = fileName.split('.').pop().toLowerCase();
      const parsedData = await this.parseCADFile(fileBuffer, fileType);
      const processedGeometry = this.geometryProcessor.process(parsedData);
      const features = await this.detectAllFeatures(processedGeometry);
      const metrics = this.calculateMetrics(features, processedGeometry);
      
      return {
        success: true,
        fileName,
        fileType,
        features,
        metrics,
        geometry: {
          bounds: processedGeometry.bounds,
          area: processedGeometry.area,
          perimeter: processedGeometry.perimeter
        }
      };
    } catch (error) {
      console.error('Feature detection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async parseCADFile(buffer, fileType) {
    switch (fileType) {
      case 'dxf':
        return this.parseDXF(buffer.toString());
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  parseDXF(content) {
    const parser = new DxfParser();
    try {
      return parser.parseSync(content);
    } catch (err) {
      throw new Error(`DXF parsing failed: ${err.message}`);
    }
  }

  // Rest of the implementation without TensorFlow dependencies
}

class GeometryProcessor {
  process(parsedData) {
    const entities = this.extractEntities(parsedData);
    const bounds = this.calculateBounds(entities);
    
    return {
      entities,
      bounds,
      area: this.estimateArea(bounds),
      perimeter: this.estimatePerimeter(bounds)
    };
  }

  extractEntities(parsedData) {
    const entities = [];
    
    if (parsedData.entities) {
      Object.values(parsedData.entities).forEach(layerEntities => {
        layerEntities.forEach(entity => {
          entities.push(this.normalizeEntity(entity));
        });
      });
    }
    
    return entities;
  }

  normalizeEntity(entity) {
    const normalized = {
      type: entity.type,
      layer: entity.layer || '0'
    };
    
    switch (entity.type) {
      case 'LINE':
        normalized.start = { x: entity.vertices[0].x, y: entity.vertices[0].y };
        normalized.end = { x: entity.vertices[1].x, y: entity.vertices[1].y };
        normalized.length = math.distance(
          [normalized.start.x, normalized.start.y],
          [normalized.end.x, normalized.end.y]
        );
        break;
        
      case 'CIRCLE':
        normalized.center = { x: entity.center.x, y: entity.center.y };
        normalized.radius = entity.radius;
        break;
        
      case 'ARC':
        normalized.center = { x: entity.center.x, y: entity.center.y };
        normalized.radius = entity.radius;
        normalized.startAngle = entity.startAngle || 0;
        normalized.endAngle = entity.endAngle || 360;
        break;
    }
    
    return normalized;
  }

  calculateBounds(entities) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'LINE':
          minX = Math.min(minX, entity.start.x, entity.end.x);
          minY = Math.min(minY, entity.start.y, entity.end.y);
          maxX = Math.max(maxX, entity.start.x, entity.end.x);
          maxY = Math.max(maxY, entity.start.y, entity.end.y);
          break;
        case 'CIRCLE':
        case 'ARC':
          minX = Math.min(minX, entity.center.x - entity.radius);
          minY = Math.min(minY, entity.center.y - entity.radius);
          maxX = Math.max(maxX, entity.center.x + entity.radius);
          maxY = Math.max(maxY, entity.center.y + entity.radius);
          break;
      }
    });
    
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }

  estimateArea(bounds) {
    return (bounds.max.x - bounds.min.x) * (bounds.max.y - bounds.min.y);
  }

  estimatePerimeter(bounds) {
    return 2 * ((bounds.max.x - bounds.min.x) + (bounds.max.y - bounds.min.y));
  }
}

class HoleDetector {
  async detect(geometry) {
    const holes = [];
    
    // Find all circular entities
    const circles = geometry.entities.filter(e => e.type === 'CIRCLE');
    
    circles.forEach(circle => {
      holes.push({
        id: `hole_${holes.length + 1}`,
        center: circle.center,
        diameter: circle.radius * 2,
        radius: circle.radius,
        classification: this.classifyHole(circle.radius * 2)
      });
    });
    
    return holes;
  }

  classifyHole(diameter) {
    const metricStandard = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const tolerance = 0.1;
    
    const nominalSize = metricStandard.find(size => 
      Math.abs(diameter - size) < tolerance
    );
    
    if (nominalSize) {
      return {
        type: 'standard',
        system: 'metric',
        nominalSize: nominalSize
      };
    }
    
    return {
      type: 'custom',
      system: null,
      nominalSize: diameter
    };
  }
}

class BendDetector {
  async detect(geometry) {
    // Simplified bend detection - look for parallel lines
    const lines = geometry.entities.filter(e => e.type === 'LINE');
    const bends = [];
    
    // This is a simplified version - in production you'd want more sophisticated detection
    const parallelPairs = this.findParallelLines(lines);
    
    parallelPairs.forEach((pair, index) => {
      bends.push({
        id: `bend_${index + 1}`,
        line: pair[0],
        angle: 90, // Default angle - would need annotation parsing for actual angle
        length: pair[0].length
      });
    });
    
    return bends;
  }

  findParallelLines(lines) {
    const pairs = [];
    const tolerance = 0.01;
    
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        if (this.areParallel(lines[i], lines[j], tolerance)) {
          pairs.push([lines[i], lines[j]]);
        }
      }
    }
    
    return pairs;
  }

  areParallel(line1, line2, tolerance) {
    // Calculate direction vectors
    const v1 = {
      x: line1.end.x - line1.start.x,
      y: line1.end.y - line1.start.y
    };
    
    const v2 = {
      x: line2.end.x - line2.start.x,
      y: line2.end.y - line2.start.y
    };
    
    // Normalize
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    v1.x /= mag1;
    v1.y /= mag1;
    v2.x /= mag2;
    v2.y /= mag2;
    
    // Check if parallel
    const cross = Math.abs(v1.x * v2.y - v1.y * v2.x);
    return cross < tolerance;
  }
}

class CutoutDetector {
  async detect(geometry) {
    // Simplified cutout detection
    // In a real implementation, you'd trace closed contours
    return [];
  }
}

class SlotDetector {
  async detect(geometry) {
    // Simplified slot detection
    // Look for oblong shapes or rounded rectangles
    return [];
  }
}

export default SheetMetalFeatureDetector;