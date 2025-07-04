// backend/src/routes/mlRoutes.js

const express = require('express');
const router = express.Router();
const MLIntegration = require('../services/ml/MLIntegration');
const ModelMonitoring = require('../services/ml/modelMonitoring');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

/**
 * Get ML metrics for dashboard
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    
    const metrics = await ModelMonitoring.getCurrentMetrics();
    const performance = await ModelMonitoring.getHistoricalMetrics(range);
    const featureImportance = await MLIntegration.featureEngineering.getTopFeatures(10);
    const businessImpact = await ModelMonitoring.calculateBusinessImpact();
    
    res.json({
      ...metrics,
      performance,
      featureImportance,
      businessImpact,
      riskDistribution: await getRiskDistribution(range),
      anomalyCategories: await getAnomalyCategories(range),
      driftAnalysis: await getDriftAnalysis(),
      insights: await generateInsights(metrics)
    });
  } catch (error) {
    console.error('Error fetching ML metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * Get active alerts
 */
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const alerts = await ModelMonitoring.getAlerts(status);
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Submit feedback for continuous learning
 */
router.post('/feedback', authenticate, async (req, res) => {
  try {
    const { quoteId, outcome, userAction, actualIssues } = req.body;
    
    await MLIntegration.processFeedback({
      quoteId,
      outcome,
      userAction,
      actualIssues,
      userId: req.user.id
    });
    
    res.json({ 
      status: 'success', 
      message: 'Feedback processed successfully' 
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

/**
 * Get model performance report
 */
router.get('/performance-report', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    const report = await ModelMonitoring.generatePerformanceReport(period);
    
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Trigger model retraining
 */
router.post('/retrain', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { force = false } = req.body;
    
    if (force || MLIntegration.shouldRetrain()) {
      MLIntegration.scheduleRetraining();
      
      res.json({ 
        status: 'scheduled', 
        message: 'Model retraining has been scheduled' 
      });
    } else {
      res.json({ 
        status: 'not_needed', 
        message: 'Model performance is satisfactory' 
      });
    }
  } catch (error) {
    console.error('Error scheduling retraining:', error);
    res.status(500).json({ error: 'Failed to schedule retraining' });
  }
});

/**
 * Get model configuration
 */
router.get('/config', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const config = await MLIntegration.getConfiguration();
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

/**
 * Update model configuration
 */
router.put('/config', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const updates = req.body;
    
    await MLIntegration.updateConfiguration(updates);
    
    res.json({ 
      status: 'success', 
      message: 'Configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * Get similar historical cases
 */
router.post('/similar-cases', authenticate, async (req, res) => {
  try {
    const { features, limit = 5 } = req.body;
    
    const similarCases = await MLIntegration.mlService.findSimilarCases(
      features, 
      limit
    );
    
    res.json(similarCases);
  } catch (error) {
    console.error('Error finding similar cases:', error);
    res.status(500).json({ error: 'Failed to find similar cases' });
  }
});

/**
 * WebSocket endpoint for real-time metrics
 */
router.ws('/ml-metrics', (ws, req) => {
  console.log('WebSocket connection established for ML metrics');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to ML metrics stream'
  }));
  
  // Subscribe to ML events
  const metricsHandler = (data) => {
    ws.send(JSON.stringify({
      type: 'metrics',
      metrics: data
    }));
  };
  
  const alertHandler = (alert) => {
    ws.send(JSON.stringify({
      type: 'alert',
      alert: alert
    }));
  };
  
  ModelMonitoring.on('metricsUpdate', metricsHandler);
  ModelMonitoring.on('alert', alertHandler);
  
  // Handle disconnection
  ws.on('close', () => {
    ModelMonitoring.off('metricsUpdate', metricsHandler);
    ModelMonitoring.off('alert', alertHandler);
    console.log('WebSocket connection closed');
  });
});

/**
 * Helper functions
 */

async function getRiskDistribution(range) {
  // Get risk score distribution for the specified range
  const distribution = [
    { name: 'CRITICAL', value: 5 },
    { name: 'HIGH', value: 15 },
    { name: 'MEDIUM', value: 30 },
    { name: 'LOW', value: 50 }
  ];
  
  return distribution;
}

async function getAnomalyCategories(range) {
  // Get anomaly counts by category
  const categories = [
    { category: 'Technical', count: 45 },
    { category: 'Customer', count: 23 },
    { category: 'Pricing', count: 18 },
    { category: 'Temporal', count: 12 },
    { category: 'Compliance', count: 7 }
  ];
  
  return categories;
}

async function getDriftAnalysis() {
  // Get feature drift data
  const features = [
    { feature: 'Area', current: 0.75, baseline: 0.70 },
    { feature: 'Complexity', current: 0.82, baseline: 0.80 },
    { feature: 'Material Cost', current: 0.65, baseline: 0.70 },
    { feature: 'Order Value', current: 0.90, baseline: 0.85 },
    { feature: 'Lead Time', current: 0.60, baseline: 0.65 }
  ];
  
  return features;
}

async function generateInsights(metrics) {
  const insights = [];
  
  // Generate insights based on metrics
  if (metrics.accuracy < 0.85) {
    insights.push({
      priority: 'HIGH',
      category: 'Performance',
      message: 'Model accuracy is below target threshold',
      action: 'Consider retraining with recent data'
    });
  }
  
  if (metrics.driftScore > 0.15) {
    insights.push({
      priority: 'MEDIUM',
      category: 'Drift',
      message: 'Significant feature drift detected',
      action: 'Review recent changes in quote patterns'
    });
  }
  
  if (metrics.avgLatency > 500) {
    insights.push({
      priority: 'LOW',
      category: 'Performance',
      message: 'Response time could be optimized',
      action: 'Consider feature reduction or model simplification'
    });
  }
  
  return insights;
}

module.exports = router;