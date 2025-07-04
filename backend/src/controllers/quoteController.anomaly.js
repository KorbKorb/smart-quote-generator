// backend/src/controllers/quoteController.js - Anomaly Detection Integration Example

const anomalyDetectionService = require('../services/anomalyDetectionService');
const dxfParser = require('../utils/dxfParser');

/**
 * Enhanced quote processing with anomaly detection
 */
async function processQuoteRequest(req, res) {
  try {
    const { file, material, thickness, quantity, tolerances, rushOrder } = req.body;
    const customer = req.user; // Assuming authenticated user
    
    // Parse DXF file
    const dxfAnalysis = await dxfParser.parse(file.buffer);
    
    // Calculate base pricing
    const materialCost = calculateMaterialCost(dxfAnalysis.area, material, thickness);
    const laborCost = calculateLaborCost(dxfAnalysis.complexity, dxfAnalysis.cutLength);
    const totalQuote = calculateTotalPrice(materialCost, laborCost, quantity, rushOrder);
    
    // Prepare data for anomaly detection
    const quoteData = {
      id: generateQuoteId(),
      customer: {
        id: customer.id,
        email: customer.email,
        isFirstTime: customer.orderCount === 0,
        type: customer.accountType,
        history: await getCustomerHistory(customer.id)
      },
      dxfAnalysis,
      material,
      thickness: parseFloat(thickness),
      quantity: parseInt(quantity),
      tolerances: parseFloat(tolerances),
      rushOrder: Boolean(rushOrder),
      orderValue: totalQuote,
      materialCost,
      laborCost,
      totalQuote,
      complexity: dxfAnalysis.complexity,
      deliveryAddress: req.body.deliveryAddress,
      timestamp: new Date(),
      fileName: file.originalname,
      notes: req.body.notes
    };
    
    // Run anomaly detection
    console.log('Running anomaly detection...');
    const anomalyResults = await anomalyDetectionService.detectAnomalies(quoteData);
    
    // Handle based on anomaly results
    switch (anomalyResults.auto_action) {
      case 'HOLD_QUOTE':
        // Don't send quote to customer, alert staff
        await alertStaff('CRITICAL_ANOMALY', {
          quoteId: quoteData.id,
          customer: customer.email,
          anomalies: anomalyResults.anomalies
        });
        
        return res.status(200).json({
          status: 'under_review',
          message: 'Your quote request is being reviewed by our team. We\'ll contact you shortly.',
          reference: quoteData.id
        });
        
      case 'MANUAL_REVIEW_REQUIRED':
        // Generate quote but flag for review
        const flaggedQuote = {
          ...generateQuoteDocument(quoteData),
          status: 'pending_review',
          anomalies: anomalyResults.anomalies.map(a => ({
            type: a.detection_type,
            message: a.details.recommendation
          }))
        };
        
        await saveQuote(flaggedQuote);
        await notifyReviewer(flaggedQuote);
        
        return res.status(200).json({
          status: 'generated_with_review',
          message: 'Quote generated. Our team will review and confirm pricing within 2 hours.',
          quote: {
            id: flaggedQuote.id,
            estimatedTotal: flaggedQuote.total,
            validUntil: flaggedQuote.validUntil
          }
        });
        
      case 'PROCEED_WITH_FLAGS':
        // Generate quote with notes
        const annotatedQuote = {
          ...generateQuoteDocument(quoteData),
          manufacturingNotes: anomalyResults.anomalies
            .filter(a => a.risk_score >= 4)
            .map(a => a.details.recommendation)
        };
        
        await saveQuote(annotatedQuote);
        
        return res.status(200).json({
          status: 'success',
          quote: annotatedQuote,
          notes: anomalyResults.anomalies
            .filter(a => a.category === 'Technical/Manufacturing')
            .map(a => a.details.recommendation)
        });
        
      case 'PROCEED_NORMAL':
      default:
        // Normal quote generation
        const quote = generateQuoteDocument(quoteData);
        await saveQuote(quote);
        
        return res.status(200).json({
          status: 'success',
          quote: quote
        });
    }
    
  } catch (error) {
    console.error('Quote processing error:', error);
    
    // Check if error is due to anomaly detection
    if (error.message.includes('anomaly')) {
      return res.status(400).json({
        error: 'Unable to process quote',
        message: 'Please contact our sales team for assistance with this part.'
      });
    }
    
    return res.status(500).json({
      error: 'Quote generation failed',
      message: 'Please try again or contact support'
    });
  }
}

/**
 * Endpoint to review and override anomalies
 */
async function reviewAnomalies(req, res) {
  try {
    const { quoteId, anomalyId, action, notes } = req.body;
    const reviewer = req.user;
    
    // Log the review decision
    await logAnomalyReview({
      quoteId,
      anomalyId,
      reviewerId: reviewer.id,
      action, // 'approve', 'reject', 'modify'
      notes,
      timestamp: new Date()
    });
    
    // Update anomaly detection learning
    if (action === 'approve') {
      // This was a false positive
      await anomalyDetectionService.recordFalsePositive(anomalyId);
    }
    
    return res.status(200).json({
      status: 'reviewed',
      message: 'Anomaly review recorded'
    });
    
  } catch (error) {
    console.error('Anomaly review error:', error);
    return res.status(500).json({
      error: 'Review failed'
    });
  }
}

/**
 * Get anomaly statistics
 */
async function getAnomalyStats(req, res) {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getAnomalyStatistics(startDate, endDate);
    
    return res.status(200).json({
      totalQuotes: stats.totalQuotes,
      anomaliesDetected: stats.anomaliesDetected,
      criticalAnomalies: stats.criticalAnomalies,
      falsePositiveRate: stats.falsePositiveRate,
      topAnomalyTypes: stats.topAnomalyTypes,
      savedFromErrors: stats.savedFromErrors
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      error: 'Unable to retrieve statistics'
    });
  }
}

module.exports = {
  processQuoteRequest,
  reviewAnomalies,
  getAnomalyStats
};