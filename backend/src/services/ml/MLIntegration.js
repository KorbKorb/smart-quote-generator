// backend/src/services/ml/MLIntegration.js

const MLAnomalyDetectionService = require('./MLAnomalyDetectionService');
const FeatureEngineering = require('./featureEngineering');
const ModelTraining = require('./modelTraining');
const BaseAnomalyService = require('../anomalyDetectionService');
const EventEmitter = require('events');

/**
 * Main ML Integration Service
 * Orchestrates ML-enhanced anomaly detection with fallback to rule-based system
 */
class MLIntegration extends EventEmitter {
  constructor() {
    super();
    
    this.mlService = MLAnomalyDetectionService;
    this.featureEngineering = FeatureEngineering;
    this.modelTraining = ModelTraining;
    this.ruleBasedService = BaseAnomalyService;
    
    this.isMLEnabled = true;
    this.performanceThreshold = 0.85;
    this.falsePositiveThreshold = 0.15;
    
    // Tracking
    this.stats = {
      mlPredictions: 0,
      rulePredictions: 0,
      agreementRate: 0,
      overrides: 0
    };
    
    // Queue for batch processing
    this.feedbackQueue = [];
    this.retrainingScheduled = false;
  }

  /**
   * Initialize ML integration
   */
  async initialize() {
    console.log('Initializing ML Integration...');
    
    try {
      // Initialize all services
      await Promise.all([
        this.mlService.initialize(),
        this.modelTraining.initialize()
      ]);
      
      // Load configuration
      await this.loadConfiguration();
      
      // Set up monitoring
      this.setupMonitoring();
      
      // Schedule periodic tasks
      this.scheduleTasks();
      
      console.log('ML Integration initialized successfully');
      
    } catch (error) {
      console.error('ML Integration initialization failed:', error);
      this.isMLEnabled = false;
    }
  }

  /**
   * Main anomaly detection entry point
   */
  async detectAnomalies(quoteData) {
    const startTime = Date.now();
    const results = {
      ml: null,
      rules: null,
      combined: null,
      processingTime: 0
    };
    
    try {
      // Always run rule-based detection as baseline
      const rulesPromise = this.ruleBasedService.detectAnomalies(quoteData);
      
      // Run ML detection if enabled
      let mlPromise = null;
      if (this.isMLEnabled) {
        // Extract features
        const features = this.featureEngineering.extractAllFeatures(quoteData);
        quoteData.features = features;
        
        mlPromise = this.mlService.detectAnomaliesML(quoteData);
      }
      
      // Wait for both results
      const [rulesResult, mlResult] = await Promise.all([
        rulesPromise,
        mlPromise || Promise.resolve(null)
      ]);
      
      results.rules = rulesResult;
      results.ml = mlResult;
      
      // Combine results intelligently
      results.combined = this.combineResults(rulesResult, mlResult);
      
      // Track performance
      results.processingTime = Date.now() - startTime;
      this.trackPerformance(results);
      
      // Emit event for monitoring
      this.emit('anomalyDetected', {
        quoteId: quoteData.id,
        results: results.combined,
        processingTime: results.processingTime
      });
      
      return results.combined;
      
    } catch (error) {
      console.error('Anomaly detection error:', error);
      
      // Fallback to rules only
      if (results.rules) {
        return results.rules;
      }
      
      // Last resort - return safe defaults
      return this.getSafeDefaults();
    }
  }

  /**
   * Intelligently combine ML and rule-based results
   */
  combineResults(rulesResult, mlResult) {
    // If ML is disabled or failed, use rules only
    if (!mlResult) {
      return rulesResult;
    }
    
    const combined = {
      anomalies: [],
      riskScore: 0,
      confidence: 0,
      source: 'hybrid',
      explanations: []
    };
    
    // Merge anomalies, avoiding duplicates
    const anomalyMap = new Map();
    
    // Add rule-based anomalies
    rulesResult.anomalies.forEach(anomaly => {
      const key = `${anomaly.category}_${anomaly.detection_type}`;
      anomalyMap.set(key, {
        ...anomaly,
        source: 'rules',
        mlConfidence: 0
      });
    });
    
    // Enhance with ML insights
    if (mlResult.factors) {
      mlResult.factors.forEach(factor => {
        const category = this.mapMLFactorToCategory(factor);
        const key = `${category}_${factor.model}`;
        
        if (anomalyMap.has(key)) {
          // Enhance existing anomaly with ML confidence
          const existing = anomalyMap.get(key);
          existing.mlConfidence = factor.confidence;
          existing.risk_score = Math.max(existing.risk_score, factor.score * 10);
        } else if (factor.score > 0.7) {
          // Add ML-only anomaly if confidence is high
          anomalyMap.set(key, {
            anomaly_id: this.generateAnomalyId(),
            severity: this.mapScoreToSeverity(factor.score),
            category: category,
            detection_type: `ML-${factor.model}`,
            details: {
              issue: mlResult.explanation || 'ML model detected unusual pattern',
              impact: 'Potential risk identified by machine learning',
              recommendation: 'Review with experienced estimator'
            },
            risk_score: factor.score * 10,
            source: 'ml',
            mlConfidence: factor.confidence
          });
        }
      });
    }
    
    // Convert map back to array
    combined.anomalies = Array.from(anomalyMap.values());
    
    // Calculate combined risk score
    const ruleScore = rulesResult.highest_risk || 0;
    const mlScore = mlResult.riskScore * 10 || 0;
    
    if (ruleScore >= 9 || mlScore >= 9) {
      // Critical from either source
      combined.riskScore = Math.max(ruleScore, mlScore);
    } else {
      // Weighted average for non-critical
      combined.riskScore = (ruleScore * 0.6 + mlScore * 0.4);
    }
    
    // Confidence calculation
    combined.confidence = mlResult.confidence || rulesResult.confidence || 0.5;
    
    // Determine action
    combined.action = this.determineAction(combined);
    
    // Add explanations
    combined.explanations = this.generateExplanations(combined, mlResult);
    
    // Add ML-specific insights
    if (mlResult.similarCases && mlResult.similarCases.length > 0) {
      combined.historicalContext = {
        similarCases: mlResult.similarCases,
        predictedOutcome: this.predictOutcome(mlResult.similarCases)
      };
    }
    
    return combined;
  }

  /**
   * Process feedback for continuous learning
   */
  async processFeedback(feedback) {
    const { quoteId, outcome, userAction, actualIssues } = feedback;
    
    try {
      // Add to feedback queue
      this.feedbackQueue.push({
        quoteId,
        outcome,
        userAction,
        actualIssues,
        timestamp: new Date()
      });
      
      // Update performance metrics
      this.updateMetrics(feedback);
      
      // Check if retraining is needed
      if (this.shouldRetrain()) {
        this.scheduleRetraining();
      }
      
      // Immediate model update for critical feedback
      if (this.isCriticalFeedback(feedback)) {
        await this.mlService.updateModels(feedback);
      }
      
      this.emit('feedbackProcessed', { quoteId, impact: 'tracked' });
      
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  }

  /**
   * Schedule model retraining
   */
  scheduleRetraining() {
    if (this.retrainingScheduled) return;
    
    this.retrainingScheduled = true;
    
    // Schedule for off-peak hours
    const delay = this.calculateRetrainingDelay();
    
    setTimeout(async () => {
      await this.retrainModels();
      this.retrainingScheduled = false;
    }, delay);
    
    console.log(`Model retraining scheduled in ${delay / 1000 / 60} minutes`);
  }

  /**
   * Retrain models with accumulated feedback
   */
  async retrainModels() {
    console.log('Starting model retraining...');
    
    try {
      // Prepare training data from feedback
      const trainingData = await this.prepareTrainingData();
      
      if (trainingData.length < 100) {
        console.log('Insufficient data for retraining');
        return;
      }
      
      // Train models
      const results = await this.modelTraining.trainModels(trainingData);
      
      // Evaluate new models
      const evaluation = await this.evaluateNewModels(results);
      
      // Deploy if performance improved
      if (evaluation.improved) {
        await this.deployNewModels();
        console.log('New models deployed successfully');
      } else {
        console.log('New models did not improve performance, keeping current models');
      }
      
      // Clear processed feedback
      this.feedbackQueue = this.feedbackQueue.slice(-100); // Keep recent 100
      
      // Emit retraining complete event
      this.emit('retrainingComplete', { results, evaluation });
      
    } catch (error) {
      console.error('Model retraining failed:', error);
      this.emit('retrainingFailed', { error: error.message });
    }
  }

  /**
   * Performance monitoring
   */
  setupMonitoring() {
    // Monitor ML vs Rules agreement
    this.on('anomalyDetected', (event) => {
      if (event.results.source === 'hybrid') {
        this.trackAgreement(event);
      }
    });
    
    // Monitor false positives
    this.on('feedbackProcessed', (event) => {
      this.updateFalsePositiveRate(event);
    });
    
    // Performance degradation detection
    setInterval(() => {
      this.checkPerformance();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Check system performance and adjust
   */
  async checkPerformance() {
    const metrics = this.getPerformanceMetrics();
    
    // Check false positive rate
    if (metrics.falsePositiveRate > this.falsePositiveThreshold) {
      console.warn('High false positive rate detected:', metrics.falsePositiveRate);
      this.adjustSensitivity(-0.1); // Reduce sensitivity
    }
    
    // Check ML performance
    if (metrics.mlAccuracy < this.performanceThreshold) {
      console.warn('ML accuracy below threshold:', metrics.mlAccuracy);
      // Consider disabling ML temporarily
      if (metrics.mlAccuracy < 0.7) {
        this.isMLEnabled = false;
        console.warn('ML disabled due to poor performance');
      }
    }
    
    // Check processing time
    if (metrics.avgProcessingTime > 1000) {
      console.warn('High processing time:', metrics.avgProcessingTime);
      // Implement optimizations
    }
    
    // Emit performance report
    this.emit('performanceReport', metrics);
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    const mlMetrics = this.mlService.getPerformanceReport();
    
    return {
      mlAccuracy: parseFloat(mlMetrics.precision) / 100,
      falsePositiveRate: this.calculateFalsePositiveRate(),
      avgProcessingTime: parseFloat(mlMetrics.avgProcessingTime),
      mlRuleAgreement: this.stats.agreementRate,
      totalPredictions: this.stats.mlPredictions + this.stats.rulePredictions,
      mlUsageRate: this.stats.mlPredictions / (this.stats.mlPredictions + this.stats.rulePredictions),
      overrideRate: this.stats.overrides / this.stats.mlPredictions
    };
  }

  /**
   * Utility methods
   */
  
  mapMLFactorToCategory(factor) {
    const mapping = {
      'technical': 'Technical/Manufacturing',
      'customer': 'Business/Commercial',
      'pricing': 'Pricing/Cost',
      'temporal': 'Pattern-Based'
    };
    return mapping[factor.model] || 'ML-Detected';
  }
  
  mapScoreToSeverity(score) {
    if (score >= 0.9) return 'CRITICAL';
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }
  
  generateAnomalyId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ANM-${dateStr}-${random}`;
  }
  
  determineAction(combined) {
    if (combined.riskScore >= 9) return 'HOLD_FOR_REVIEW';
    if (combined.riskScore >= 7) return 'FLAG_FOR_REVIEW';
    if (combined.riskScore >= 4) return 'PROCEED_WITH_FLAGS';
    return 'PROCEED_NORMAL';
  }
  
  generateExplanations(combined, mlResult) {
    const explanations = [];
    
    // Add top anomalies
    combined.anomalies
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 3)
      .forEach(anomaly => {
        explanations.push(`${anomaly.details.issue} (Risk: ${anomaly.risk_score.toFixed(1)})`);
      });
    
    // Add ML explanation if available
    if (mlResult && mlResult.explanation) {
      explanations.push(`ML Analysis: ${mlResult.explanation}`);
    }
    
    return explanations;
  }
  
  predictOutcome(similarCases) {
    if (!similarCases || similarCases.length === 0) {
      return { confidence: 0, prediction: 'unknown' };
    }
    
    const outcomes = similarCases.map(c => c.outcome);
    const successRate = outcomes.filter(o => o === 'success').length / outcomes.length;
    
    return {
      confidence: Math.min(similarCases[0].similarity, 0.95),
      prediction: successRate > 0.7 ? 'likely success' : 'potential issues',
      successRate: successRate
    };
  }
  
  /**
   * Configuration management
   */
  async loadConfiguration() {
    // Load from config file or database
    this.config = {
      mlEnabled: true,
      sensitivity: 0.5,
      retrainingInterval: 7 * 24 * 60 * 60 * 1000, // Weekly
      minTrainingData: 100,
      performanceThreshold: 0.85,
      falsePositiveThreshold: 0.15
    };
  }
  
  adjustSensitivity(delta) {
    this.config.sensitivity = Math.max(0.1, Math.min(0.9, this.config.sensitivity + delta));
    console.log(`Sensitivity adjusted to ${this.config.sensitivity}`);
  }
  
  /**
   * Safe defaults for error cases
   */
  getSafeDefaults() {
    return {
      anomalies: [{
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'System',
        detection_type: 'Error',
        details: {
          issue: 'Anomaly detection system error',
          impact: 'Unable to fully analyze quote',
          recommendation: 'Manual review required'
        },
        risk_score: 8
      }],
      highest_risk: 8,
      action: 'FLAG_FOR_REVIEW',
      summary: 'System error - manual review required'
    };
  }
}

module.exports = new MLIntegration();