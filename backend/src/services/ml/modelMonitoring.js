// backend/src/services/ml/modelMonitoring.js

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Model Monitoring and Performance Tracking Service
 */
class ModelMonitoringService extends EventEmitter {
  constructor() {
    super();
    
    this.metrics = {
      predictions: new Map(),
      performance: {
        daily: [],
        weekly: [],
        monthly: []
      },
      drift: {
        features: new Map(),
        predictions: new Map(),
        concepts: new Map()
      },
      alerts: []
    };
    
    this.thresholds = {
      accuracy: 0.85,
      precision: 0.80,
      recall: 0.75,
      f1Score: 0.78,
      latency: 1000, // ms
      driftScore: 0.15
    };
    
    this.monitoringInterval = null;
    this.reportPath = path.join(__dirname, '../../../reports/ml-monitoring');
  }

  /**
   * Start monitoring
   */
  async startMonitoring() {
    console.log('Starting ML model monitoring...');
    
    // Ensure report directory exists
    await fs.mkdir(this.reportPath, { recursive: true });
    
    // Set up real-time monitoring
    this.setupRealTimeMonitoring();
    
    // Schedule periodic evaluations
    this.scheduleEvaluations();
    
    // Load historical metrics
    await this.loadHistoricalMetrics();
  }

  /**
   * Track prediction and outcome
   */
  async trackPrediction(predictionData) {
    const {
      id,
      timestamp,
      features,
      prediction,
      confidence,
      modelVersion,
      processingTime
    } = predictionData;
    
    // Store prediction
    this.metrics.predictions.set(id, {
      timestamp,
      features,
      prediction,
      confidence,
      modelVersion,
      processingTime,
      outcome: null,
      feedback: null
    });
    
    // Update latency metrics
    this.updateLatencyMetrics(processingTime);
    
    // Check for feature drift
    this.checkFeatureDrift(features);
    
    // Trim old predictions
    this.trimOldPredictions();
  }

  /**
   * Update with actual outcome
   */
  async updateOutcome(id, outcome) {
    const prediction = this.metrics.predictions.get(id);
    
    if (!prediction) {
      console.warn(`No prediction found for id: ${id}`);
      return;
    }
    
    prediction.outcome = outcome;
    prediction.outcomeTimestamp = new Date();
    
    // Calculate metrics
    this.updatePerformanceMetrics(prediction);
    
    // Check for concept drift
    this.checkConceptDrift(prediction);
    
    // Emit event if performance degraded
    if (this.isPerformanceDegraded()) {
      this.emit('performanceDegradation', {
        metrics: this.getCurrentMetrics(),
        alerts: this.generateAlerts()
      });
    }
  }

  /**
   * Real-time monitoring setup
   */
  setupRealTimeMonitoring() {
    // Monitor every minute
    this.monitoringInterval = setInterval(() => {
      this.performRealTimeChecks();
    }, 60 * 1000);
  }

  /**
   * Perform real-time checks
   */
  async performRealTimeChecks() {
    const currentMetrics = this.getCurrentMetrics();
    
    // Check thresholds
    const violations = this.checkThresholdViolations(currentMetrics);
    
    if (violations.length > 0) {
      this.handleThresholdViolations(violations);
    }
    
    // Update dashboards
    this.emit('metricsUpdate', currentMetrics);
    
    // Log metrics
    await this.logMetrics(currentMetrics);
  }

  /**
   * Calculate current performance metrics
   */
  getCurrentMetrics() {
    const recentPredictions = this.getRecentPredictions(1000);
    
    if (recentPredictions.length === 0) {
      return this.getDefaultMetrics();
    }
    
    // Calculate classification metrics
    const tp = recentPredictions.filter(p => p.prediction === 1 && p.outcome === 1).length;
    const fp = recentPredictions.filter(p => p.prediction === 1 && p.outcome === 0).length;
    const tn = recentPredictions.filter(p => p.prediction === 0 && p.outcome === 0).length;
    const fn = recentPredictions.filter(p => p.prediction === 0 && p.outcome === 1).length;
    
    const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    // Calculate other metrics
    const avgLatency = this.calculateAverageLatency(recentPredictions);
    const avgConfidence = this.calculateAverageConfidence(recentPredictions);
    const driftScore = this.calculateDriftScore();
    
    return {
      timestamp: new Date(),
      predictions: recentPredictions.length,
      accuracy,
      precision,
      recall,
      f1Score,
      avgLatency,
      avgConfidence,
      driftScore,
      confusionMatrix: { tp, fp, tn, fn }
    };
  }

  /**
   * Check for threshold violations
   */
  checkThresholdViolations(metrics) {
    const violations = [];
    
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      if (metrics[metric] !== undefined) {
        if (metric === 'latency' || metric === 'driftScore') {
          // Higher is worse for these metrics
          if (metrics[metric] > threshold) {
            violations.push({
              metric,
              value: metrics[metric],
              threshold,
              severity: this.calculateSeverity(metric, metrics[metric], threshold)
            });
          }
        } else {
          // Lower is worse for these metrics
          if (metrics[metric] < threshold) {
            violations.push({
              metric,
              value: metrics[metric],
              threshold,
              severity: this.calculateSeverity(metric, metrics[metric], threshold)
            });
          }
        }
      }
    });
    
    return violations;
  }

  /**
   * Feature drift detection
   */
  checkFeatureDrift(features) {
    Object.entries(features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([feature, value]) => {
        const key = `${category}.${feature}`;
        
        if (!this.metrics.drift.features.has(key)) {
          this.metrics.drift.features.set(key, {
            values: [],
            baseline: { mean: 0, std: 1 }
          });
        }
        
        const drift = this.metrics.drift.features.get(key);
        drift.values.push(value);
        
        // Keep only recent values
        if (drift.values.length > 1000) {
          drift.values = drift.values.slice(-1000);
        }
        
        // Calculate drift score
        const driftScore = this.calculateFeatureDriftScore(drift);
        
        if (driftScore > 0.2) {
          this.emit('featureDrift', {
            feature: key,
            driftScore,
            currentStats: this.calculateStats(drift.values),
            baseline: drift.baseline
          });
        }
      });
    });
  }

  /**
   * Concept drift detection
   */
  checkConceptDrift(prediction) {
    const window = 100;
    const recentPredictions = this.getRecentPredictions(window);
    
    if (recentPredictions.length < window) {
      return;
    }
    
    // Calculate error rate over time
    const errorRates = [];
    const windowSize = 20;
    
    for (let i = 0; i <= recentPredictions.length - windowSize; i += 5) {
      const windowPredictions = recentPredictions.slice(i, i + windowSize);
      const errors = windowPredictions.filter(p => 
        p.outcome !== null && p.prediction !== p.outcome
      ).length;
      const errorRate = errors / windowPredictions.length;
      errorRates.push(errorRate);
    }
    
    // Detect trend
    const trend = this.detectTrend(errorRates);
    
    if (trend.increasing && trend.significance > 0.1) {
      this.emit('conceptDrift', {
        trend,
        currentErrorRate: errorRates[errorRates.length - 1],
        baselineErrorRate: errorRates[0]
      });
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(period = 'daily') {
    const report = {
      period,
      generatedAt: new Date(),
      summary: this.getCurrentMetrics(),
      trends: this.analyzeTrends(period),
      alerts: this.metrics.alerts.filter(a => this.isInPeriod(a.timestamp, period)),
      recommendations: this.generateRecommendations(),
      modelComparison: await this.compareModels(),
      featureDrift: this.getFeatureDriftSummary(),
      businessImpact: this.calculateBusinessImpact()
    };
    
    // Save report
    const fileName = `ml-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(
      path.join(this.reportPath, fileName),
      JSON.stringify(report, null, 2)
    );
    
    // Generate visualizations
    await this.generateVisualizations(report);
    
    return report;
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(period) {
    const historicalMetrics = this.getHistoricalMetrics(period);
    
    if (historicalMetrics.length < 2) {
      return { status: 'insufficient_data' };
    }
    
    const trends = {
      accuracy: this.calculateTrend(historicalMetrics.map(m => m.accuracy)),
      precision: this.calculateTrend(historicalMetrics.map(m => m.precision)),
      recall: this.calculateTrend(historicalMetrics.map(m => m.recall)),
      latency: this.calculateTrend(historicalMetrics.map(m => m.avgLatency)),
      volume: this.calculateTrend(historicalMetrics.map(m => m.predictions))
    };
    
    return {
      trends,
      improving: Object.values(trends).filter(t => t.direction === 'improving').length,
      degrading: Object.values(trends).filter(t => t.direction === 'degrading').length,
      stable: Object.values(trends).filter(t => t.direction === 'stable').length
    };
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.getCurrentMetrics();
    
    // Accuracy recommendations
    if (metrics.accuracy < this.thresholds.accuracy) {
      recommendations.push({
        priority: 'HIGH',
        category: 'accuracy',
        recommendation: 'Model accuracy below threshold. Consider retraining with recent data.',
        impact: `Current accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`,
        action: 'Schedule model retraining'
      });
    }
    
    // Latency recommendations
    if (metrics.avgLatency > this.thresholds.latency) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'performance',
        recommendation: 'High prediction latency detected.',
        impact: `Average latency: ${metrics.avgLatency.toFixed(0)}ms`,
        action: 'Optimize feature extraction or consider model simplification'
      });
    }
    
    // Drift recommendations
    if (metrics.driftScore > this.thresholds.driftScore) {
      recommendations.push({
        priority: 'HIGH',
        category: 'drift',
        recommendation: 'Significant drift detected in features or predictions.',
        impact: `Drift score: ${metrics.driftScore.toFixed(3)}`,
        action: 'Investigate data changes and retrain if necessary'
      });
    }
    
    // Confidence recommendations
    if (metrics.avgConfidence < 0.7) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'confidence',
        recommendation: 'Low average prediction confidence.',
        impact: `Average confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%`,
        action: 'Review uncertain predictions and gather more training data'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate business impact
   */
  calculateBusinessImpact() {
    const recentPredictions = this.getRecentPredictions(1000);
    
    // Calculate prevented losses
    const truePositives = recentPredictions.filter(p => 
      p.prediction === 1 && p.outcome === 1
    );
    
    const preventedLosses = truePositives.reduce((sum, p) => {
      // Estimate based on quote value and risk
      const quoteValue = p.features?.pricing?.totalQuote || 1000;
      const riskFactor = p.prediction * 0.1; // 10% risk factor
      return sum + (quoteValue * riskFactor);
    }, 0);
    
    // Calculate false alarm costs
    const falsePositives = recentPredictions.filter(p => 
      p.prediction === 1 && p.outcome === 0
    );
    
    const falseAlarmCosts = falsePositives.length * 50; // $50 per false alarm
    
    return {
      predictionsAnalyzed: recentPredictions.length,
      issuesDetected: truePositives.length,
      preventedLosses,
      falseAlarms: falsePositives.length,
      falseAlarmCosts,
      netBenefit: preventedLosses - falseAlarmCosts,
      roi: ((preventedLosses - falseAlarmCosts) / falseAlarmCosts) || 0
    };
  }

  /**
   * Model comparison
   */
  async compareModels() {
    // Compare current model with previous versions
    const comparison = {
      current: {
        version: 'v2.3.1',
        metrics: this.getCurrentMetrics()
      },
      previous: {
        version: 'v2.3.0',
        metrics: await this.loadPreviousMetrics('v2.3.0')
      },
      improvement: {}
    };
    
    // Calculate improvements
    Object.keys(comparison.current.metrics).forEach(metric => {
      if (typeof comparison.current.metrics[metric] === 'number' &&
          comparison.previous.metrics[metric]) {
        const current = comparison.current.metrics[metric];
        const previous = comparison.previous.metrics[metric];
        comparison.improvement[metric] = ((current - previous) / previous) * 100;
      }
    });
    
    return comparison;
  }

  /**
   * Alert handling
   */
  async handleThresholdViolations(violations) {
    for (const violation of violations) {
      const alert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        type: 'threshold_violation',
        metric: violation.metric,
        value: violation.value,
        threshold: violation.threshold,
        severity: violation.severity,
        status: 'active'
      };
      
      this.metrics.alerts.push(alert);
      
      // Emit alert
      this.emit('alert', alert);
      
      // Take automated actions for critical alerts
      if (violation.severity === 'CRITICAL') {
        await this.handleCriticalAlert(alert);
      }
    }
  }

  /**
   * Visualization generation
   */
  async generateVisualizations(report) {
    // Generate HTML dashboard
    const dashboard = `
<!DOCTYPE html>
<html>
<head>
  <title>ML Model Performance Report - ${report.period}</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
    .alert { background: #ffcccc; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .recommendation { background: #ccffcc; padding: 10px; margin: 10px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>ML Model Performance Report</h1>
  <h2>Generated: ${report.generatedAt}</h2>
  
  <div id="metrics">
    <div class="metric">
      <h3>Accuracy</h3>
      <h1>${(report.summary.accuracy * 100).toFixed(1)}%</h1>
    </div>
    <div class="metric">
      <h3>Precision</h3>
      <h1>${(report.summary.precision * 100).toFixed(1)}%</h1>
    </div>
    <div class="metric">
      <h3>Recall</h3>
      <h1>${(report.summary.recall * 100).toFixed(1)}%</h1>
    </div>
    <div class="metric">
      <h3>F1 Score</h3>
      <h1>${report.summary.f1Score.toFixed(3)}</h1>
    </div>
  </div>
  
  <div id="performance-chart"></div>
  <div id="confusion-matrix"></div>
  <div id="drift-chart"></div>
  
  <h2>Alerts</h2>
  ${report.alerts.map(a => `
    <div class="alert">
      <strong>${a.severity}</strong>: ${a.metric} = ${a.value.toFixed(3)} 
      (threshold: ${a.threshold})
    </div>
  `).join('')}
  
  <h2>Recommendations</h2>
  ${report.recommendations.map(r => `
    <div class="recommendation">
      <strong>${r.priority}</strong>: ${r.recommendation}
      <br>Impact: ${r.impact}
      <br>Action: ${r.action}
    </div>
  `).join('')}
  
  <h2>Business Impact</h2>
  <div class="metric">
    <h3>Prevented Losses</h3>
    <h1>$${report.businessImpact.preventedLosses.toFixed(2)}</h1>
  </div>
  <div class="metric">
    <h3>ROI</h3>
    <h1>${(report.businessImpact.roi * 100).toFixed(1)}%</h1>
  </div>
  
  <script>
    // Add Plotly charts here
  </script>
</body>
</html>
    `;
    
    const fileName = `ml-dashboard-${report.period}-${new Date().toISOString().split('T')[0]}.html`;
    await fs.writeFile(
      path.join(this.reportPath, fileName),
      dashboard
    );
  }

  /**
   * Utility methods
   */
  
  getRecentPredictions(count) {
    const predictions = Array.from(this.metrics.predictions.values())
      .filter(p => p.outcome !== null)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
    
    return predictions;
  }
  
  calculateAverageLatency(predictions) {
    if (predictions.length === 0) return 0;
    const sum = predictions.reduce((total, p) => total + p.processingTime, 0);
    return sum / predictions.length;
  }
  
  calculateAverageConfidence(predictions) {
    if (predictions.length === 0) return 0;
    const sum = predictions.reduce((total, p) => total + p.confidence, 0);
    return sum / predictions.length;
  }
  
  calculateDriftScore() {
    // Simplified drift score calculation
    const featureDrifts = Array.from(this.metrics.drift.features.values())
      .map(drift => this.calculateFeatureDriftScore(drift));
    
    if (featureDrifts.length === 0) return 0;
    
    return featureDrifts.reduce((sum, score) => sum + score, 0) / featureDrifts.length;
  }
  
  calculateFeatureDriftScore(drift) {
    if (drift.values.length < 10) return 0;
    
    const currentStats = this.calculateStats(drift.values.slice(-100));
    const baseline = drift.baseline;
    
    // Kullback-Leibler divergence approximation
    const meanDiff = Math.abs(currentStats.mean - baseline.mean) / baseline.std;
    const stdRatio = currentStats.std / baseline.std;
    const klDivergence = meanDiff + Math.abs(Math.log(stdRatio));
    
    return Math.min(klDivergence / 10, 1); // Normalize to 0-1
  }
  
  calculateStats(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return { mean, std, variance };
  }
  
  detectTrend(values) {
    if (values.length < 3) {
      return { direction: 'stable', significance: 0 };
    }
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const significance = Math.abs(slope) * n;
    
    return {
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      slope,
      significance,
      increasing: slope > 0.01
    };
  }
  
  calculateTrend(values) {
    const trend = this.detectTrend(values);
    
    return {
      direction: trend.direction === 'increasing' ? 'improving' : 
                 trend.direction === 'decreasing' ? 'degrading' : 'stable',
      change: trend.slope,
      confidence: Math.min(trend.significance / 10, 1)
    };
  }
  
  generateAlertId() {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  calculateSeverity(metric, value, threshold) {
    const deviation = Math.abs(value - threshold) / threshold;
    
    if (deviation > 0.5) return 'CRITICAL';
    if (deviation > 0.25) return 'HIGH';
    if (deviation > 0.1) return 'MEDIUM';
    return 'LOW';
  }
  
  trimOldPredictions() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = Date.now() - maxAge;
    
    for (const [id, prediction] of this.metrics.predictions.entries()) {
      if (prediction.timestamp < cutoff) {
        this.metrics.predictions.delete(id);
      }
    }
  }
  
  async loadHistoricalMetrics() {
    try {
      const files = await fs.readdir(this.reportPath);
      // Load and parse historical reports
      // Implementation depends on storage format
    } catch (error) {
      console.error('Error loading historical metrics:', error);
    }
  }
  
  getDefaultMetrics() {
    return {
      timestamp: new Date(),
      predictions: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      avgLatency: 0,
      avgConfidence: 0,
      driftScore: 0,
      confusionMatrix: { tp: 0, fp: 0, tn: 0, fn: 0 }
    };
  }
  
  async handleCriticalAlert(alert) {
    // Implement critical alert handling
    // E.g., disable ML predictions, notify administrators, etc.
    console.error('CRITICAL ALERT:', alert);
  }
}

module.exports = new ModelMonitoringService();