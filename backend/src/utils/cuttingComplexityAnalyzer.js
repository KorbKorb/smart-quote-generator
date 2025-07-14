// cuttingComplexityAnalyzer.js
// Analyzes DXF cutting paths to determine complexity and calculate accurate cutting costs

class CuttingComplexityAnalyzer {
  constructor(dxfData) {
    this.entities = dxfData.entities || [];
    this.bounds = dxfData.bounds || {};
  }

  analyzeCuttingComplexity() {
    const analysis = {
      totalCuts: 0,
      straightCuts: 0,
      curvedCuts: 0,
      tightCorners: 0,
      intricatePatterns: 0,
      segments: [],
      complexityScore: 0,
      recommendations: []
    };

    // Analyze each entity
    this.entities.forEach(entity => {
      switch (entity.type) {
        case 'LINE':
          analysis.straightCuts++;
          const lineLength = this.calculateLineLength(entity);
          if (lineLength > 0) {
            analysis.segments.push({
              type: 'straight',
              length: lineLength,
              rate: 0.10
            });
          }
          break;

        case 'ARC':
        case 'CIRCLE':
          analysis.curvedCuts++;
          const radius = entity.radius || 0;
          const arcLength = this.calculateArcLength(entity);
          
          // Check for tight curves
          if (radius < 0.25) { // Less than 1/4 inch radius
            analysis.tightCorners++;
            analysis.segments.push({
              type: 'tightCorner',
              length: arcLength,
              rate: 0.20,
              radius: radius
            });
          } else {
            analysis.segments.push({
              type: 'curved',
              length: arcLength,
              rate: 0.15,
              radius: radius
            });
          }
          break;

        case 'POLYLINE':
        case 'LWPOLYLINE':
          const polylineAnalysis = this.analyzePolyline(entity);
          analysis.straightCuts += polylineAnalysis.straightSegments;
          analysis.curvedCuts += polylineAnalysis.curvedSegments;
          analysis.tightCorners += polylineAnalysis.tightCorners;
          analysis.segments.push(...polylineAnalysis.segments);
          break;

        case 'SPLINE':
          analysis.intricatePatterns++;
          analysis.segments.push({
            type: 'intricate',
            length: this.estimateSplineLength(entity),
            rate: 0.25
          });
          break;
      }
    });

    analysis.totalCuts = analysis.segments.length;

    // Calculate complexity score (0-100)
    analysis.complexityScore = this.calculateComplexityScore(analysis);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    // Calculate weighted cutting cost
    analysis.weightedCuttingCost = this.calculateWeightedCost(analysis.segments);

    return analysis;
  }

  calculateLineLength(line) {
    // Handle different property names from DXF parser
    if (line.vertices && line.vertices.length >= 2) {
      // LINE entities use vertices array
      const start = line.vertices[0];
      const end = line.vertices[1];
      const dx = (end.x || 0) - (start.x || 0);
      const dy = (end.y || 0) - (start.y || 0);
      return Math.sqrt(dx * dx + dy * dy);
    } else if (line.startPoint && line.endPoint) {
      // Alternative format
      const dx = (line.endPoint.x || 0) - (line.startPoint.x || 0);
      const dy = (line.endPoint.y || 0) - (line.startPoint.y || 0);
      return Math.sqrt(dx * dx + dy * dy);
    } else if (line.start && line.end) {
      // Another alternative format
      const dx = (line.end.x || 0) - (line.start.x || 0);
      const dy = (line.end.y || 0) - (line.start.y || 0);
      return Math.sqrt(dx * dx + dy * dy);
    }
    return 0;
  }

  calculateArcLength(arc) {
    if (arc.type === 'CIRCLE') {
      return 2 * Math.PI * (arc.radius || 0);
    }
    // For arcs, calculate based on angle
    const angleRad = ((arc.endAngle || 360) - (arc.startAngle || 0)) * Math.PI / 180;
    return Math.abs(angleRad * (arc.radius || 0));
  }

  analyzePolyline(polyline) {
    const result = {
      straightSegments: 0,
      curvedSegments: 0,
      tightCorners: 0,
      segments: []
    };

    const vertices = polyline.vertices || [];
    
    // Skip if not enough vertices
    if (vertices.length < 2) return result;
    
    for (let i = 0; i < vertices.length - 1; i++) {
      const v1 = vertices[i];
      const v2 = vertices[i + 1];
      
      // Check for bulge (indicates arc)
      if (v1.bulge && Math.abs(v1.bulge) > 0.01) {
        const arcData = this.bulgeToArc(v1, v2);
        result.curvedSegments++;
        
        if (arcData.radius < 0.25) {
          result.tightCorners++;
          result.segments.push({
            type: 'tightCorner',
            length: arcData.length,
            rate: 0.20,
            radius: arcData.radius
          });
        } else {
          result.segments.push({
            type: 'curved',
            length: arcData.length,
            rate: 0.15,
            radius: arcData.radius
          });
        }
      } else {
        // Straight segment
        result.straightSegments++;
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        result.segments.push({
          type: 'straight',
          length: length,
          rate: 0.10
        });
      }

      // Check for sharp corners at vertices
      if (i > 0 && i < vertices.length - 1) {
        const angle = this.calculateVertexAngle(
          vertices[i - 1],
          vertices[i],
          vertices[i + 1]
        );
        
        if (angle < 45) { // Sharp corner
          result.tightCorners++;
        }
      }
    }

    return result;
  }

  bulgeToArc(v1, v2) {
    // Convert bulge to arc parameters
    const chord = Math.sqrt(
      Math.pow(v2.x - v1.x, 2) + 
      Math.pow(v2.y - v1.y, 2)
    );
    
    const s = chord / 2;
    const bulge = v1.bulge || 0;
    const h = Math.abs(bulge) * s;
    
    const radius = (h / 2) + (s * s) / (2 * h);
    const angle = 4 * Math.atan(Math.abs(bulge));
    const length = radius * angle;
    
    return { radius, length, angle };
  }

  calculateVertexAngle(v1, v2, v3) {
    // Calculate angle at v2
    const dx1 = v1.x - v2.x;
    const dy1 = v1.y - v2.y;
    const dx2 = v3.x - v2.x;
    const dy2 = v3.y - v2.y;
    
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    
    let angle = Math.abs(angle2 - angle1) * 180 / Math.PI;
    if (angle > 180) angle = 360 - angle;
    
    return angle;
  }

  estimateSplineLength(spline) {
    // Simplified spline length estimation
    const controlPoints = spline.controlPoints || [];
    let length = 0;
    
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const dx = controlPoints[i + 1].x - controlPoints[i].x;
      const dy = controlPoints[i + 1].y - controlPoints[i].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Splines are typically longer than control point distances
    return length * 1.2;
  }

  calculateComplexityScore(analysis) {
    let score = 0;
    
    // Base score on cut type distribution
    const totalCuts = analysis.totalCuts || 1;
    score += (analysis.curvedCuts / totalCuts) * 20;
    score += (analysis.tightCorners / totalCuts) * 30;
    score += (analysis.intricatePatterns / totalCuts) * 40;
    
    // Add points for high cut density
    const partArea = this.calculateBoundingArea();
    const cutDensity = analysis.totalCuts / partArea;
    if (cutDensity > 0.5) score += 10;
    if (cutDensity > 1.0) score += 10;
    
    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  calculateBoundingArea() {
    const width = (this.bounds.maxX || 0) - (this.bounds.minX || 0);
    const height = (this.bounds.maxY || 0) - (this.bounds.minY || 0);
    return width * height || 1;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.tightCorners > 5) {
      recommendations.push({
        type: 'design',
        message: 'Consider increasing corner radii where possible to reduce cutting time',
        impact: 'medium'
      });
    }
    
    if (analysis.intricatePatterns > 0) {
      recommendations.push({
        type: 'process',
        message: 'Complex patterns detected - waterjet may be more suitable than laser',
        impact: 'high'
      });
    }
    
    if (analysis.complexityScore > 70) {
      recommendations.push({
        type: 'pricing',
        message: 'High complexity part - consider adding setup time premium',
        impact: 'high'
      });
    }
    
    return recommendations;
  }

  calculateWeightedCost(segments) {
    return segments.reduce((total, segment) => {
      return total + (segment.length * segment.rate);
    }, 0);
  }
}

// Integration with existing quoteCalculator.js
function enhancedCalculateCuttingCost(dxfData, thickness, material) {
  const analyzer = new CuttingComplexityAnalyzer(dxfData);
  const analysis = analyzer.analyzeCuttingComplexity();
  
  // Apply thickness multiplier
  const thicknessMultiplier = getThicknessMultiplier(thickness);
  
  // Apply material-specific multiplier
  const materialMultiplier = getMaterialCuttingMultiplier(material);
  
  const baseCost = analysis.weightedCuttingCost;
  const totalCuttingCost = baseCost * thicknessMultiplier * materialMultiplier;
  
  return {
    cost: totalCuttingCost,
    analysis: analysis,
    breakdown: {
      baseCost: baseCost,
      thicknessMultiplier: thicknessMultiplier,
      materialMultiplier: materialMultiplier,
      segments: analysis.segments.length,
      complexityScore: analysis.complexityScore
    }
  };
}

function getThicknessMultiplier(thickness) {
  // Existing thickness multipliers from your code
  if (thickness <= 0.0625) return 1.0;
  if (thickness <= 0.125) return 1.2;
  if (thickness <= 0.25) return 1.5;
  if (thickness <= 0.375) return 2.0;
  if (thickness <= 0.5) return 2.5;
  return 3.0;
}

function getMaterialCuttingMultiplier(material) {
  // Material-specific cutting difficulty
  const multipliers = {
    'cold-rolled-steel': 1.0,
    'stainless-steel-304': 1.3,
    'stainless-steel-316': 1.4,
    'aluminum-6061': 0.8,
    'aluminum-5052': 0.75
  };
  
  return multipliers[material] || 1.0;
}

module.exports = { 
  CuttingComplexityAnalyzer, 
  enhancedCalculateCuttingCost 
};