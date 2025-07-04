// backend/src/services/ml/featureEngineering.js

const stats = require('simple-statistics');

class FeatureEngineering {
  constructor() {
    this.scalers = new Map();
    this.encoders = new Map();
    this.featureImportance = new Map();
  }

  /**
   * Master feature extraction for sheet metal quotes
   */
  extractAllFeatures(quoteData) {
    return {
      geometric: this.extractGeometricFeatures(quoteData),
      material: this.extractMaterialFeatures(quoteData),
      manufacturing: this.extractManufacturingFeatures(quoteData),
      customer: this.extractCustomerFeatures(quoteData),
      temporal: this.extractTemporalFeatures(quoteData),
      market: this.extractMarketFeatures(quoteData),
      interaction: this.extractInteractionFeatures(quoteData)
    };
  }

  /**
   * Geometric features from DXF analysis
   */
  extractGeometricFeatures(quoteData) {
    const { dxfAnalysis } = quoteData;
    
    if (!dxfAnalysis) {
      return this.getDefaultGeometricFeatures();
    }

    const features = {
      // Basic measurements
      area: dxfAnalysis.area,
      perimeter: dxfAnalysis.perimeter,
      boundingBoxArea: dxfAnalysis.boundingBox.width * dxfAnalysis.boundingBox.height,
      
      // Shape complexity
      convexity: this.calculateConvexity(dxfAnalysis),
      compactness: this.calculateCompactness(dxfAnalysis),
      elongation: this.calculateElongation(dxfAnalysis.boundingBox),
      
      // Feature density
      holeCount: dxfAnalysis.holeCount,
      holeDensity: dxfAnalysis.holeCount / dxfAnalysis.area,
      avgHoleSize: this.calculateAvgHoleSize(dxfAnalysis.holes),
      holeAreaRatio: this.calculateHoleAreaRatio(dxfAnalysis),
      
      // Cut complexity
      cutLength: dxfAnalysis.cutLength,
      cutComplexity: dxfAnalysis.cutLength / dxfAnalysis.perimeter,
      
      // Bend features
      bendCount: dxfAnalysis.bendLines?.length || 0,
      totalBendLength: this.calculateTotalBendLength(dxfAnalysis.bendLines),
      avgBendAngle: this.estimateBendAngles(dxfAnalysis.bendLines),
      
      // Advanced geometric
      cornerCount: this.countCorners(dxfAnalysis),
      symmetryScore: this.calculateSymmetry(dxfAnalysis),
      nestingEfficiency: this.estimateNestingEfficiency(dxfAnalysis)
    };

    return this.normalizeFeatures(features, 'geometric');
  }

  /**
   * Material-specific features
   */
  extractMaterialFeatures(quoteData) {
    const { material, thickness, finish } = quoteData;
    
    const materialProps = this.getMaterialProperties(material);
    
    return {
      // Material properties
      density: materialProps.density,
      tensileStrength: materialProps.tensileStrength,
      yieldStrength: materialProps.yieldStrength,
      elongation: materialProps.elongation,
      
      // Thickness features
      thickness: thickness,
      thicknessCategory: this.categorizeThickness(thickness),
      
      // Material cost factors
      materialCostIndex: materialProps.costIndex,
      availability: materialProps.availability,
      leadTime: materialProps.typicalLeadTime,
      
      // Process compatibility
      laserCuttable: materialProps.laserCuttable ? 1 : 0,
      plasmaCuttable: materialProps.plasmaCuttable ? 1 : 0,
      waterjetRequired: materialProps.waterjetRequired ? 1 : 0,
      
      // Finish requirements
      finishComplexity: this.encodeFinishComplexity(finish),
      finishCostFactor: this.getFinishCostFactor(finish),
      
      // Special handling
      requiresGrainDirection: materialProps.grainSensitive ? 1 : 0,
      corrosionResistance: materialProps.corrosionResistance
    };
  }

  /**
   * Manufacturing process features
   */
  extractManufacturingFeatures(quoteData) {
    const { dxfAnalysis, material, thickness, quantity, tolerances } = quoteData;
    
    return {
      // Setup complexity
      setupComplexity: this.calculateSetupComplexity(dxfAnalysis, quantity),
      toolChanges: this.estimateToolChanges(dxfAnalysis, material),
      
      // Process time estimates
      cuttingTime: this.estimateCuttingTime(dxfAnalysis, material, thickness),
      bendingTime: this.estimateBendingTime(dxfAnalysis.bendLines, thickness),
      
      // Tolerance factors
      toleranceLevel: this.encodeToleranceLevel(tolerances),
      precisionRequired: tolerances < 0.005 ? 1 : 0,
      
      // Batch efficiency
      quantityEfficiency: this.calculateQuantityEfficiency(quantity),
      nestingYield: this.estimateNestingYield(dxfAnalysis, quantity),
      
      // Risk factors
      crackRisk: this.calculateCrackRisk(dxfAnalysis, material, thickness),
      warpingRisk: this.calculateWarpingRisk(dxfAnalysis),
      
      // Machine selection
      optimalMachine: this.selectOptimalMachine(dxfAnalysis, material, thickness),
      alternativeMachines: this.countAlternativeMachines(dxfAnalysis, material)
    };
  }

  /**
   * Customer behavior features
   */
  extractCustomerFeatures(quoteData) {
    const { customer } = quoteData;
    
    return {
      // Customer profile
      customerAge: this.calculateCustomerAge(customer.joinDate),
      lifetimeValue: customer.lifetimeValue || 0,
      orderCount: customer.orderCount || 0,
      
      // Order patterns
      avgOrderValue: customer.avgOrderValue || 0,
      orderFrequency: customer.orderFrequency || 0,
      lastOrderDays: this.daysSinceLastOrder(customer.lastOrderDate),
      
      // Payment behavior
      paymentScore: customer.paymentScore || 1,
      avgPaymentDays: customer.avgPaymentDays || 30,
      
      // Industry
      industryCode: this.encodeIndustry(customer.industry),
      industryRisk: this.getIndustryRisk(customer.industry),
      
      // Engagement
      quoteConversionRate: customer.conversionRate || 0,
      communicationScore: customer.communicationScore || 1,
      
      // Location
      shippingDistance: this.calculateShippingDistance(customer.location),
      isInternational: customer.international ? 1 : 0
    };
  }

  /**
   * Temporal and seasonal features
   */
  extractTemporalFeatures(quoteData) {
    const date = new Date(quoteData.timestamp);
    
    return {
      // Time of day (cyclical encoding)
      hourSin: Math.sin(2 * Math.PI * date.getHours() / 24),
      hourCos: Math.cos(2 * Math.PI * date.getHours() / 24),
      
      // Day of week (cyclical encoding)
      dayOfWeekSin: Math.sin(2 * Math.PI * date.getDay() / 7),
      dayOfWeekCos: Math.cos(2 * Math.PI * date.getDay() / 7),
      
      // Month (cyclical encoding)
      monthSin: Math.sin(2 * Math.PI * date.getMonth() / 12),
      monthCos: Math.cos(2 * Math.PI * date.getMonth() / 12),
      
      // Business indicators
      isBusinessHours: this.isBusinessHours(date) ? 1 : 0,
      isWeekend: (date.getDay() === 0 || date.getDay() === 6) ? 1 : 0,
      
      // Seasonal
      quarter: Math.floor(date.getMonth() / 3),
      isEndOfMonth: date.getDate() > 25 ? 1 : 0,
      isEndOfQuarter: (date.getMonth() % 3 === 2 && date.getDate() > 20) ? 1 : 0,
      
      // Fiscal periods
      fiscalWeek: this.getFiscalWeek(date),
      daysUntilMonthEnd: this.daysUntilMonthEnd(date),
      
      // Rush indicators
      leadTimeDays: quoteData.requestedLeadTime || 14,
      isRushOrder: quoteData.rushOrder ? 1 : 0
    };
  }

  /**
   * Market condition features
   */
  extractMarketFeatures(quoteData) {
    const { material, timestamp } = quoteData;
    
    return {
      // Material market conditions
      materialPriceIndex: this.getMaterialPriceIndex(material, timestamp),
      materialVolatility: this.getMaterialVolatility(material),
      
      // Capacity utilization
      shopUtilization: this.getShopUtilization(timestamp),
      machineAvailability: this.getMachineAvailability(timestamp),
      
      // Competition
      recentWinRate: this.getRecentWinRate(),
      competitorActivity: this.getCompetitorActivity(),
      
      // Economic indicators
      industrialProductionIndex: this.getIndustrialProductionIndex(timestamp),
      manufacturingPMI: this.getManufacturingPMI(timestamp),
      
      // Demand signals
      quotesVolumeIndex: this.getQuotesVolumeIndex(timestamp),
      seasonalDemandFactor: this.getSeasonalDemandFactor(timestamp)
    };
  }

  /**
   * Interaction features (combinations)
   */
  extractInteractionFeatures(quoteData) {
    const geo = this.extractGeometricFeatures(quoteData);
    const mat = this.extractMaterialFeatures(quoteData);
    const mfg = this.extractManufacturingFeatures(quoteData);
    
    return {
      // Material-geometry interactions
      thicknessToHoleRatio: mat.thickness / (geo.avgHoleSize || 1),
      bendRadiusRisk: (geo.bendCount * mat.thickness) / mat.yieldStrength,
      
      // Complexity-quantity interactions
      complexityQuantityScore: geo.cutComplexity * Math.log(quoteData.quantity + 1),
      setupPerPiece: mfg.setupComplexity / quoteData.quantity,
      
      // Material-process interactions
      materialMachinability: mat.tensileStrength / (mfg.cuttingTime || 1),
      finishProcessCompatibility: mat.corrosionResistance * mat.finishComplexity,
      
      // Cost driver interactions
      materialValueDensity: mat.materialCostIndex * mat.density * mat.thickness,
      laborIntensity: mfg.bendingTime / (mfg.cuttingTime || 1),
      
      // Risk combinations
      combinedRisk: mfg.crackRisk * mfg.warpingRisk * geo.elongation,
      toleranceDifficulty: (1 / quoteData.tolerances) * geo.cutComplexity
    };
  }

  /**
   * Feature scaling and normalization
   */
  normalizeFeatures(features, category) {
    const normalized = {};
    
    Object.entries(features).forEach(([key, value]) => {
      const scalerKey = `${category}_${key}`;
      
      if (!this.scalers.has(scalerKey)) {
        // Initialize scaler with default range
        this.scalers.set(scalerKey, { min: 0, max: 1, mean: 0.5, std: 0.25 });
      }
      
      const scaler = this.scalers.get(scalerKey);
      normalized[key] = (value - scaler.min) / (scaler.max - scaler.min);
    });
    
    return normalized;
  }

  /**
   * Helper calculation methods
   */
  
  calculateConvexity(dxfAnalysis) {
    // Ratio of area to convex hull area
    const convexHullArea = dxfAnalysis.convexHullArea || dxfAnalysis.boundingBox.width * dxfAnalysis.boundingBox.height;
    return dxfAnalysis.area / convexHullArea;
  }
  
  calculateCompactness(dxfAnalysis) {
    // Isoperimetric quotient
    return (4 * Math.PI * dxfAnalysis.area) / (dxfAnalysis.perimeter * dxfAnalysis.perimeter);
  }
  
  calculateElongation(boundingBox) {
    const { width, height } = boundingBox;
    return Math.max(width, height) / Math.min(width, height);
  }
  
  calculateAvgHoleSize(holes) {
    if (!holes || holes.length === 0) return 0;
    const totalArea = holes.reduce((sum, hole) => sum + Math.PI * hole.diameter * hole.diameter / 4, 0);
    return Math.sqrt(totalArea / holes.length / Math.PI) * 2;
  }
  
  calculateHoleAreaRatio(dxfAnalysis) {
    if (!dxfAnalysis.holes || dxfAnalysis.holes.length === 0) return 0;
    const totalHoleArea = dxfAnalysis.holes.reduce((sum, hole) => 
      sum + Math.PI * hole.diameter * hole.diameter / 4, 0);
    return totalHoleArea / dxfAnalysis.area;
  }
  
  calculateTotalBendLength(bendLines) {
    if (!bendLines) return 0;
    return bendLines.reduce((sum, bend) => sum + bend.length, 0);
  }
  
  estimateBendAngles(bendLines) {
    // Default to 90 degrees for standard bends
    return bendLines && bendLines.length > 0 ? 90 : 0;
  }
  
  countCorners(dxfAnalysis) {
    // Estimate based on polyline vertices
    return dxfAnalysis.vertices?.length || 4;
  }
  
  calculateSymmetry(dxfAnalysis) {
    // Simplified symmetry score
    const { width, height } = dxfAnalysis.boundingBox;
    return 1 - Math.abs(width - height) / Math.max(width, height);
  }
  
  estimateNestingEfficiency(dxfAnalysis) {
    // Ratio of actual area to bounding box
    const boundingArea = dxfAnalysis.boundingBox.width * dxfAnalysis.boundingBox.height;
    return dxfAnalysis.area / boundingArea;
  }
  
  /**
   * Material property database
   */
  getMaterialProperties(material) {
    const materials = {
      'Cold Rolled Steel': {
        density: 0.2836,
        tensileStrength: 55000,
        yieldStrength: 45000,
        elongation: 0.20,
        costIndex: 1.0,
        availability: 0.95,
        typicalLeadTime: 3,
        laserCuttable: true,
        plasmaCuttable: true,
        waterjetRequired: false,
        grainSensitive: false,
        corrosionResistance: 0.3
      },
      'Stainless Steel 304': {
        density: 0.289,
        tensileStrength: 75000,
        yieldStrength: 30000,
        elongation: 0.40,
        costIndex: 3.5,
        availability: 0.90,
        typicalLeadTime: 5,
        laserCuttable: true,
        plasmaCuttable: true,
        waterjetRequired: false,
        grainSensitive: false,
        corrosionResistance: 0.9
      },
      'Aluminum 6061': {
        density: 0.098,
        tensileStrength: 45000,
        yieldStrength: 40000,
        elongation: 0.12,
        costIndex: 2.5,
        availability: 0.92,
        typicalLeadTime: 4,
        laserCuttable: true,
        plasmaCuttable: false,
        waterjetRequired: false,
        grainSensitive: true,
        corrosionResistance: 0.8
      }
    };
    
    return materials[material] || materials['Cold Rolled Steel'];
  }
  
  categorizeThickness(thickness) {
    if (thickness < 0.05) return 0;  // Thin
    if (thickness < 0.125) return 1; // Medium
    if (thickness < 0.25) return 2;  // Thick
    return 3; // Very thick
  }
  
  encodeFinishComplexity(finish) {
    const finishTypes = {
      'none': 0,
      'deburr': 1,
      'brushed': 2,
      'painted': 3,
      'powder-coat': 4,
      'anodized': 5,
      'plated': 6
    };
    return finishTypes[finish] || 0;
  }
  
  getFinishCostFactor(finish) {
    const costFactors = {
      'none': 1.0,
      'deburr': 1.1,
      'brushed': 1.2,
      'painted': 1.5,
      'powder-coat': 1.6,
      'anodized': 2.0,
      'plated': 2.5
    };
    return costFactors[finish] || 1.0;
  }
  
  /**
   * Manufacturing calculations
   */
  calculateSetupComplexity(dxfAnalysis, quantity) {
    if (!dxfAnalysis) return 1;
    
    const factors = [
      dxfAnalysis.holeCount > 10 ? 1.5 : 1,
      dxfAnalysis.bendLines?.length > 2 ? 1.5 : 1,
      dxfAnalysis.complexity === 'complex' ? 2 : 1,
      quantity < 10 ? 1.5 : 1
    ];
    
    return factors.reduce((a, b) => a * b, 1);
  }
  
  estimateToolChanges(dxfAnalysis, material) {
    let changes = 1; // Base tool
    
    if (dxfAnalysis.holes) {
      const uniqueSizes = new Set(dxfAnalysis.holes.map(h => h.diameter));
      changes += uniqueSizes.size;
    }
    
    if (material.includes('Stainless')) {
      changes *= 1.5; // More tool wear
    }
    
    return Math.round(changes);
  }
  
  estimateCuttingTime(dxfAnalysis, material, thickness) {
    if (!dxfAnalysis) return 1;
    
    const feedRates = {
      'Cold Rolled Steel': 100,
      'Stainless Steel 304': 60,
      'Aluminum 6061': 200
    };
    
    const feedRate = feedRates[material] || 100;
    const adjustedRate = feedRate * (0.1 / thickness); // Adjust for thickness
    
    return dxfAnalysis.cutLength / adjustedRate;
  }
  
  estimateBendingTime(bendLines, thickness) {
    if (!bendLines || bendLines.length === 0) return 0;
    
    const setupTime = 5; // minutes per setup
    const bendTime = 0.5; // minutes per bend
    const thicknessFactor = thickness > 0.125 ? 1.5 : 1;
    
    return setupTime + (bendLines.length * bendTime * thicknessFactor);
  }
  
  /**
   * Risk calculations
   */
  calculateCrackRisk(dxfAnalysis, material, thickness) {
    let risk = 0;
    
    // Bend radius check
    if (dxfAnalysis.bendLines) {
      const minBendRadius = thickness * 0.8;
      const tightBends = dxfAnalysis.bendLines.filter(b => 
        b.radius && b.radius < minBendRadius
      );
      risk += tightBends.length * 0.2;
    }
    
    // Material brittleness
    if (material.includes('Stainless') && thickness > 0.25) {
      risk += 0.3;
    }
    
    return Math.min(risk, 1);
  }
  
  calculateWarpingRisk(dxfAnalysis) {
    if (!dxfAnalysis) return 0;
    
    const { width, height } = dxfAnalysis.boundingBox;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    
    let risk = 0;
    
    if (aspectRatio > 10) risk += 0.3;
    if (aspectRatio > 20) risk += 0.4;
    
    // Large cutout areas increase warping risk
    const cutoutRatio = 1 - (dxfAnalysis.area / (width * height));
    if (cutoutRatio > 0.5) risk += 0.3;
    
    return Math.min(risk, 1);
  }
  
  /**
   * Temporal calculations
   */
  isBusinessHours(date) {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 17;
  }
  
  getFiscalWeek(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
  
  daysUntilMonthEnd(date) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return Math.ceil((lastDay - date) / (24 * 60 * 60 * 1000));
  }
  
  /**
   * Market data (mock implementation)
   */
  getMaterialPriceIndex(material, timestamp) {
    // In production, fetch from market data API
    return 1.0 + (Math.random() - 0.5) * 0.2;
  }
  
  getMaterialVolatility(material) {
    const volatility = {
      'Cold Rolled Steel': 0.15,
      'Stainless Steel 304': 0.25,
      'Aluminum 6061': 0.30
    };
    return volatility[material] || 0.20;
  }
  
  getShopUtilization(timestamp) {
    // Mock: varies by time of day and week
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    if (day === 0 || day === 6) return 0.2; // Weekend
    if (hour < 8 || hour > 17) return 0.3;  // Off hours
    
    return 0.7 + Math.random() * 0.2;
  }
  
  /**
   * Feature importance tracking
   */
  updateFeatureImportance(feature, importance) {
    const current = this.featureImportance.get(feature) || 0;
    this.featureImportance.set(feature, current * 0.9 + importance * 0.1);
  }
  
  getTopFeatures(n = 10) {
    return Array.from(this.featureImportance.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([feature, importance]) => ({ feature, importance }));
  }
}

module.exports = new FeatureEngineering();