// backend/src/services/ml/MLAnomalyDetectionService.js

const tf = require('@tensorflow/tfjs-node');
const { IsolationForest } = require('isolation-forest');
const { KMeans } = require('ml-kmeans');
const stats = require('simple-statistics');
const EventEmitter = require('events');

class MLAnomalyDetectionService extends EventEmitter {
  constructor() {
    super();
    
    this.models = {
      technical: null,
      customer: null,
      pricing: null,
      temporal: null,
      ensemble: null
    };
    
    this.featureCache = new Map();
    this.modelVersion = '2.3.1';
    this.isInitialized = false;
    
    // Performance tracking
    this.metrics = {
      predictions: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      processingTimes: []
    };
  }

  /**
   * Initialize ML models
   */
  async initialize() {
    console.log('Initializing ML Anomaly Detection Service...');
    
    try {
      // Load or create models
      await this.loadModels();
      
      // Initialize feature extractors
      this.initializeFeatureExtractors();
      
      // Set up continuous learning
      this.setupContinuousLearning();
      
      this.isInitialized = true;
      console.log('ML Anomaly Detection Service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ML service:', error);
      throw error;
    }
  }

  /**
   * Main ML-enhanced anomaly detection
   */
  async detectAnomaliesML(quoteData) {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Extract features
      const features = await this.extractFeatures(quoteData);
      
      // Run individual models
      const technicalScore = await this.detectTechnicalAnomaliesML(features.technical);
      const customerScore = await this.detectCustomerAnomaliesML(features.customer);
      const pricingScore = await this.detectPricingAnomaliesML(features.pricing);
      const temporalScore = await this.detectTemporalAnomaliesML(features.temporal);
      
      // Ensemble prediction
      const ensembleResult = this.ensemblePrediction({
        technical: technicalScore,
        customer: customerScore,
        pricing: pricingScore,
        temporal: temporalScore
      });
      
      // Generate explanations
      const explanation = this.generateExplanation(ensembleResult, features);
      
      // Track performance
      const processingTime = Date.now() - startTime;
      this.trackPerformance(processingTime);
      
      return {
        riskScore: ensembleResult.score,
        confidence: ensembleResult.confidence,
        category: this.categorizeRisk(ensembleResult.score),
        factors: ensembleResult.factors,
        explanation: explanation,
        similarCases: await this.findSimilarCases(features),
        recommendedActions: this.generateRecommendations(ensembleResult),
        processingTime: processingTime
      };
      
    } catch (error) {
      console.error('ML anomaly detection error:', error);
      // Fallback to rule-based detection
      return this.fallbackDetection(quoteData);
    }
  }

  /**
   * Feature extraction pipeline
   */
  async extractFeatures(quoteData) {
    const features = {
      technical: this.extractTechnicalFeatures(quoteData),
      customer: await this.extractCustomerFeatures(quoteData),
      pricing: this.extractPricingFeatures(quoteData),
      temporal: this.extractTemporalFeatures(quoteData),
      combined: []
    };
    
    // Combine all features for ensemble model
    features.combined = [
      ...Object.values(features.technical),
      ...Object.values(features.customer),
      ...Object.values(features.pricing),
      ...Object.values(features.temporal)
    ];
    
    return features;
  }

  /**
   * Technical feature extraction
   */
  extractTechnicalFeatures(quoteData) {
    const { dxfAnalysis, material, thickness } = quoteData;
    
    if (!dxfAnalysis) {
      return this.getDefaultTechnicalFeatures();
    }
    
    const features = {
      // Normalized geometric features
      normalizedArea: this.normalize(dxfAnalysis.area, 0, 1000),
      perimeterToAreaRatio: dxfAnalysis.perimeter / Math.sqrt(dxfAnalysis.area),
      holeCountNormalized: this.normalize(dxfAnalysis.holeCount, 0, 100),
      bendComplexityScore: this.calculateBendComplexity(dxfAnalysis.bendLines),
      aspectRatio: this.calculateAspectRatio(dxfAnalysis.boundingBox),
      featureDensity: dxfAnalysis.holeCount / dxfAnalysis.area,
      
      // Material context
      materialCategory: this.encodeMaterial(material),
      thicknessNormalized: this.normalize(thickness, 0.01, 0.5),
      
      // Complexity indicators
      cutLengthRatio: dxfAnalysis.cutLength / dxfAnalysis.perimeter,
      holeToThicknessRatio: this.calculateHoleToThicknessRatio(dxfAnalysis.holes, thickness),
      
      // Risk indicators
      tightToleranceFlag: quoteData.tolerances < 0.005 ? 1 : 0,
      oversizeFlag: this.checkOversizePart(dxfAnalysis.boundingBox) ? 1 : 0
    };
    
    return features;
  }

  /**
   * Customer feature extraction with history
   */
  async extractCustomerFeatures(quoteData) {
    const { customer, orderValue, quantity } = quoteData;
    const history = await this.getCustomerHistory(customer.id);
    
    if (!history || history.length === 0) {
      return this.getDefaultCustomerFeatures();
    }
    
    // Calculate baseline metrics
    const avgOrderValue = stats.mean(history.map(h => h.value));
    const stdOrderValue = stats.standardDeviation(history.map(h => h.value));
    const avgQuantity = stats.mean(history.map(h => h.quantity));
    
    // Calculate deviations
    const orderValueDeviation = (orderValue - avgOrderValue) / (stdOrderValue || 1);
    const quantityDeviation = (quantity - avgQuantity) / avgQuantity;
    
    // Temporal patterns
    const daysSinceLastOrder = this.calculateDaysSince(history[0].date);
    const orderFrequency = history.length / 365; // Orders per year
    
    // Customer segment features
    const segment = await this.getCustomerSegment(customer.id);
    
    return {
      // Order patterns
      orderValueDeviation: this.clamp(orderValueDeviation, -5, 5),
      quantityDeviation: this.clamp(quantityDeviation, -5, 5),
      isFirstTimeCustomer: customer.isFirstTime ? 1 : 0,
      daysSinceLastOrder: this.normalize(daysSinceLastOrder, 0, 365),
      orderFrequency: this.normalize(orderFrequency, 0, 52),
      
      // Customer profile
      customerSegment: this.encodeSegment(segment),
      paymentHistoryScore: this.calculatePaymentScore(history),
      conversionRate: this.calculateConversionRate(history),
      
      // Risk indicators
      suddenValueSpike: orderValueDeviation > 3 ? 1 : 0,
      unusualMaterial: this.checkUnusualMaterial(quoteData.material, history) ? 1 : 0
    };
  }

  /**
   * Pricing feature extraction
   */
  extractPricingFeatures(quoteData) {
    const { materialCost, laborCost, totalQuote, complexity, quantity } = quoteData;
    
    // Calculate margins and ratios
    const materialRatio = materialCost / totalQuote;
    const laborRatio = laborCost / totalQuote;
    const margin = (totalQuote - materialCost - laborCost) / totalQuote;
    
    // Expected margins by complexity
    const expectedMargins = {
      simple: 0.35,
      moderate: 0.40,
      complex: 0.50
    };
    const expectedMargin = expectedMargins[complexity] || 0.40;
    const marginDeviation = (margin - expectedMargin) / expectedMargin;
    
    // Quantity discount analysis
    const quantityDiscount = this.calculateQuantityDiscount(quantity, totalQuote);
    
    return {
      materialRatio: this.clamp(materialRatio, 0, 1),
      laborRatio: this.clamp(laborRatio, 0, 1),
      marginNormalized: this.clamp(margin, -1, 1),
      marginDeviation: this.clamp(marginDeviation, -2, 2),
      quantityDiscountRate: quantityDiscount,
      
      // Risk indicators
      lowMarginFlag: margin < 0.15 ? 1 : 0,
      negativeMarginFlag: margin < 0 ? 1 : 0,
      complexityPriceMismatch: Math.abs(marginDeviation) > 0.5 ? 1 : 0,
      
      // Market indicators
      pricePerUnit: totalQuote / quantity,
      pricePerArea: totalQuote / (quoteData.dxfAnalysis?.area || 1)
    };
  }

  /**
   * Temporal feature extraction
   */
  extractTemporalFeatures(quoteData) {
    const date = new Date(quoteData.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    // Encode cyclical features
    const hourSin = Math.sin(2 * Math.PI * hour / 24);
    const hourCos = Math.cos(2 * Math.PI * hour / 24);
    const daySin = Math.sin(2 * Math.PI * dayOfWeek / 7);
    const dayCos = Math.cos(2 * Math.PI * dayOfWeek / 7);
    const monthSin = Math.sin(2 * Math.PI * month / 12);
    const monthCos = Math.cos(2 * Math.PI * month / 12);
    
    // Business hour flags
    const isBusinessHours = hour >= 8 && hour <= 17;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Seasonal indicators
    const season = this.getSeason(month);
    const isEndOfQuarter = month % 3 === 2;
    
    return {
      hourSin,
      hourCos,
      daySin,
      dayCos,
      monthSin,
      monthCos,
      isBusinessHours: isBusinessHours ? 1 : 0,
      isWeekend: isWeekend ? 1 : 0,
      seasonEncoded: this.encodeSeason(season),
      isEndOfQuarter: isEndOfQuarter ? 1 : 0,
      
      // Rush indicators
      isRushOrder: quoteData.rushOrder ? 1 : 0,
      daysUntilDeadline: this.normalize(quoteData.daysUntilDeadline || 30, 0, 60)
    };
  }

  /**
   * Technical anomaly detection using neural network
   */
  async detectTechnicalAnomaliesML(features) {
    if (!this.models.technical) {
      return { score: 0, confidence: 0 };
    }
    
    try {
      // Convert features to tensor
      const input = tf.tensor2d([Object.values(features)]);
      
      // Run prediction
      const prediction = this.models.technical.predict(input);
      const score = await prediction.data();
      
      // Clean up tensors
      input.dispose();
      prediction.dispose();
      
      // Calculate confidence based on feature extremity
      const confidence = this.calculateConfidence(features);
      
      return {
        score: score[0],
        confidence: confidence,
        topFactors: this.identifyTopFactors(features, 'technical')
      };
      
    } catch (error) {
      console.error('Technical ML detection error:', error);
      return { score: 0, confidence: 0 };
    }
  }

  /**
   * Customer anomaly detection using isolation forest
   */
  async detectCustomerAnomaliesML(features) {
    if (!this.models.customer) {
      // Initialize isolation forest if not exists
      this.models.customer = new IsolationForest({
        nEstimators: 100,
        maxSamples: 256,
        contamination: 0.1
      });
    }
    
    try {
      const featureArray = Object.values(features);
      const anomalyScore = this.models.customer.anomalyScore([featureArray])[0];
      
      // Convert to probability (0-1 range)
      const normalizedScore = this.normalizeAnomalyScore(anomalyScore);
      
      return {
        score: normalizedScore,
        confidence: this.calculateCustomerConfidence(features),
        cluster: await this.getCustomerCluster(featureArray)
      };
      
    } catch (error) {
      console.error('Customer ML detection error:', error);
      return { score: 0, confidence: 0 };
    }
  }

  /**
   * Pricing anomaly detection with market intelligence
   */
  async detectPricingAnomaliesML(features) {
    // Get market context
    const marketContext = await this.getMarketContext();
    
    // Adjust features based on market conditions
    const adjustedFeatures = this.adjustForMarket(features, marketContext);
    
    // Calculate anomaly score
    const baseScore = this.calculatePricingAnomalyScore(adjustedFeatures);
    
    // Apply market intelligence
    const marketAdjustedScore = baseScore * marketContext.competitivePressure;
    
    return {
      score: marketAdjustedScore,
      confidence: marketContext.dataQuality,
      marketFactors: marketContext.factors,
      competitorPosition: marketContext.relativePosition
    };
  }

  /**
   * Temporal pattern anomaly detection using LSTM
   */
  async detectTemporalAnomaliesML(features) {
    // For now, use statistical methods
    // LSTM implementation would go here
    
    const patterns = await this.getHistoricalPatterns();
    const deviation = this.calculatePatternDeviation(features, patterns);
    
    return {
      score: deviation.score,
      confidence: deviation.confidence,
      patterns: deviation.matchedPatterns,
      seasonalityFactor: deviation.seasonalityFactor
    };
  }

  /**
   * Ensemble prediction combining all models
   */
  ensemblePrediction(scores) {
    // Weighted voting based on confidence
    const weights = {
      technical: 0.3,
      customer: 0.2,
      pricing: 0.25,
      temporal: 0.25
    };
    
    let weightedSum = 0;
    let confidenceSum = 0;
    const factors = [];
    
    Object.entries(scores).forEach(([model, result]) => {
      const weight = weights[model] * result.confidence;
      weightedSum += result.score * weight;
      confidenceSum += weight;
      
      if (result.score > 0.5) {
        factors.push({
          model,
          score: result.score,
          confidence: result.confidence,
          impact: weight
        });
      }
    });
    
    const ensembleScore = confidenceSum > 0 ? weightedSum / confidenceSum : 0;
    const overallConfidence = confidenceSum / Object.keys(weights).length;
    
    // Sort factors by impact
    factors.sort((a, b) => b.impact - a.impact);
    
    return {
      score: ensembleScore,
      confidence: overallConfidence,
      factors,
      unanimous: Object.values(scores).every(s => s.score > 0.7),
      divergent: this.checkDivergence(scores)
    };
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(result, features) {
    const explanations = [];
    
    // Add top factors
    result.factors.slice(0, 3).forEach(factor => {
      const explanation = this.explainFactor(factor, features);
      if (explanation) {
        explanations.push(explanation);
      }
    });
    
    // Add overall assessment
    if (result.score > 0.8) {
      explanations.unshift('This quote shows multiple significant anomalies:');
    } else if (result.score > 0.5) {
      explanations.unshift('This quote has some unusual characteristics:');
    } else {
      explanations.unshift('This quote appears mostly normal with minor variations:');
    }
    
    // Add confidence statement
    if (result.confidence < 0.5) {
      explanations.push('Note: Limited historical data reduces confidence in this assessment.');
    }
    
    return explanations.join('\n');
  }

  /**
   * Find similar historical cases
   */
  async findSimilarCases(features, limit = 3) {
    try {
      const historicalCases = await this.getHistoricalCases();
      
      if (!historicalCases || historicalCases.length === 0) {
        return [];
      }
      
      // Calculate similarity scores
      const similarities = historicalCases.map(case_ => ({
        ...case_,
        similarity: this.calculateSimilarity(features.combined, case_.features)
      }));
      
      // Sort by similarity and take top matches
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      return similarities.slice(0, limit).map(case_ => ({
        id: case_.id,
        date: case_.date,
        similarity: case_.similarity,
        outcome: case_.outcome,
        issues: case_.issues,
        resolution: case_.resolution
      }));
      
    } catch (error) {
      console.error('Error finding similar cases:', error);
      return [];
    }
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(result) {
    const recommendations = [];
    
    // Critical risk recommendations
    if (result.score > 0.8) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Manual review required',
        reason: 'Multiple high-risk factors detected'
      });
    }
    
    // Factor-specific recommendations
    result.factors.forEach(factor => {
      const recommendation = this.getFactorRecommendation(factor);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });
    
    // Add preventive recommendations
    if (result.divergent) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Cross-check with senior estimator',
        reason: 'Models show conflicting signals'
      });
    }
    
    return recommendations;
  }

  /**
   * Continuous learning implementation
   */
  async updateModels(feedback) {
    const { quoteId, outcome, actualCost, issues, userOverride } = feedback;
    
    try {
      // Retrieve original features
      const features = this.featureCache.get(quoteId);
      if (!features) {
        console.warn(`No cached features for quote ${quoteId}`);
        return;
      }
      
      // Update training data
      await this.updateTrainingData({
        features,
        outcome,
        actualCost,
        issues,
        userOverride
      });
      
      // Trigger retraining if needed
      if (this.shouldRetrain()) {
        this.scheduleRetraining();
      }
      
      // Update performance metrics
      this.updateMetrics(outcome, userOverride);
      
      // Clean up old cache entries
      this.cleanupCache();
      
    } catch (error) {
      console.error('Error updating models:', error);
    }
  }

  /**
   * Helper methods
   */
  
  normalize(value, min, max) {
    return (value - min) / (max - min);
  }
  
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  encodeMaterial(material) {
    const materials = {
      'Cold Rolled Steel': 0,
      'Stainless Steel 304': 1,
      'Stainless Steel 316': 2,
      'Aluminum 6061': 3,
      'Other': 4
    };
    return materials[material] || 4;
  }
  
  calculateSimilarity(features1, features2) {
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  categorizeRisk(score) {
    if (score >= 0.9) return 'CRITICAL';
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    if (score >= 0.1) return 'LOW';
    return 'MINIMAL';
  }
  
  /**
   * Performance tracking
   */
  trackPerformance(processingTime) {
    this.metrics.predictions++;
    this.metrics.processingTimes.push(processingTime);
    
    // Keep only recent processing times
    if (this.metrics.processingTimes.length > 1000) {
      this.metrics.processingTimes = this.metrics.processingTimes.slice(-1000);
    }
  }
  
  getPerformanceReport() {
    const avgProcessingTime = stats.mean(this.metrics.processingTimes);
    const precision = this.metrics.truePositives / 
      (this.metrics.truePositives + this.metrics.falsePositives || 1);
    const recall = this.metrics.truePositives / 
      (this.metrics.truePositives + this.metrics.falseNegatives || 1);
    const f1Score = 2 * (precision * recall) / (precision + recall || 1);
    
    return {
      totalPredictions: this.metrics.predictions,
      avgProcessingTime: avgProcessingTime.toFixed(2) + 'ms',
      precision: (precision * 100).toFixed(2) + '%',
      recall: (recall * 100).toFixed(2) + '%',
      f1Score: f1Score.toFixed(3),
      modelVersion: this.modelVersion
    };
  }
}

module.exports = new MLAnomalyDetectionService();