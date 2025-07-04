// backend/src/services/anomalyDetectionService.js

const fs = require('fs').promises;
const path = require('path');

class AnomalyDetectionService {
  constructor() {
    this.riskThresholds = {
      CRITICAL: 9,
      HIGH: 7,
      MEDIUM: 4,
      LOW: 1
    };
    
    this.anomalyLog = [];
    this.loadPrompt();
  }

  async loadPrompt() {
    try {
      const promptPath = path.join(__dirname, 'anomalyDetectionPrompt.md');
      this.systemPrompt = await fs.readFile(promptPath, 'utf-8');
    } catch (error) {
      console.error('Failed to load anomaly detection prompt:', error);
    }
  }

  /**
   * Main anomaly detection method
   * @param {Object} quoteData - Complete quote request data
   * @returns {Object} Anomaly detection results
   */
  async detectAnomalies(quoteData) {
    const anomalies = [];
    
    // Run all detection categories
    const technicalAnomalies = await this.detectTechnicalAnomalies(quoteData);
    const businessAnomalies = await this.detectBusinessAnomalies(quoteData);
    const pricingAnomalies = await this.detectPricingAnomalies(quoteData);
    const patternAnomalies = await this.detectPatternAnomalies(quoteData);
    const complianceAnomalies = await this.detectComplianceAnomalies(quoteData);
    
    // Combine all anomalies
    anomalies.push(...technicalAnomalies, ...businessAnomalies, 
                   ...pricingAnomalies, ...patternAnomalies, ...complianceAnomalies);
    
    // Sort by risk score
    anomalies.sort((a, b) => b.risk_score - a.risk_score);
    
    // Log for learning
    this.logAnomalies(anomalies, quoteData);
    
    return {
      anomalies,
      highest_risk: anomalies[0]?.risk_score || 0,
      critical_count: anomalies.filter(a => a.risk_score >= this.riskThresholds.CRITICAL).length,
      auto_action: this.determineAutoAction(anomalies),
      summary: this.generateSummary(anomalies)
    };
  }

  /**
   * Technical/Manufacturing Anomaly Detection
   */
  async detectTechnicalAnomalies(quoteData) {
    const anomalies = [];
    const { dxfAnalysis, material, thickness, tolerances } = quoteData;
    
    if (!dxfAnalysis) return anomalies;

    // Check hole to thickness ratio
    if (dxfAnalysis.holes) {
      dxfAnalysis.holes.forEach((hole, index) => {
        if (hole.diameter > thickness) {
          anomalies.push({
            anomaly_id: this.generateAnomalyId(),
            severity: 'HIGH',
            category: 'Technical/Manufacturing',
            detection_type: 'Hole-to-Thickness Ratio',
            details: {
              issue: `Hole diameter (${hole.diameter}") exceeds material thickness (${thickness}")`,
              location: `Hole #${index + 1} at position (${hole.x}, ${hole.y})`,
              impact: 'Material will tear during punching - requires laser cutting',
              recommendation: 'Switch to laser cutting or reduce hole size'
            },
            risk_score: 8,
            auto_action: 'FLAG_FOR_REVIEW'
          });
        }
      });
    }

    // Check bend radius
    if (dxfAnalysis.bendLines && dxfAnalysis.bendLines.length > 0) {
      const minBendRadius = thickness * 0.8; // Industry standard
      dxfAnalysis.bendLines.forEach((bend, index) => {
        if (bend.radius && bend.radius < minBendRadius) {
          anomalies.push({
            anomaly_id: this.generateAnomalyId(),
            severity: 'CRITICAL',
            category: 'Technical/Manufacturing',
            detection_type: 'Insufficient Bend Radius',
            details: {
              issue: `Bend radius (${bend.radius}") is less than minimum (${minBendRadius}")`,
              location: `Bend line #${index + 1}`,
              impact: 'Material will crack at bend',
              recommendation: 'Increase bend radius or switch to more ductile material'
            },
            risk_score: 9,
            auto_action: 'HOLD_FOR_REVIEW'
          });
        }
      });
    }

    // Check tolerances
    if (tolerances && tolerances < 0.005 && !quoteData.specialProcess) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Technical/Manufacturing',
        detection_type: 'Tight Tolerance',
        details: {
          issue: `Tolerance (±${tolerances}") requires special processing`,
          location: 'General specification',
          impact: 'Standard processes cannot achieve this tolerance',
          recommendation: 'Specify precision machining or relax tolerance'
        },
        risk_score: 7,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    // Check part size
    if (dxfAnalysis.boundingBox) {
      const { width, height } = dxfAnalysis.boundingBox;
      if (width > 48 || height > 96) {
        anomalies.push({
          anomaly_id: this.generateAnomalyId(),
          severity: 'HIGH',
          category: 'Technical/Manufacturing',
          detection_type: 'Oversized Part',
          details: {
            issue: `Part size (${width}" x ${height}") exceeds standard sheet`,
            location: 'Overall dimensions',
            impact: 'Requires special material ordering',
            recommendation: 'Confirm material availability or split into multiple parts'
          },
          risk_score: 7,
          auto_action: 'FLAG_FOR_REVIEW'
        });
      }
    }

    // Check aspect ratio
    if (dxfAnalysis.boundingBox) {
      const { width, height } = dxfAnalysis.boundingBox;
      const aspectRatio = Math.max(width, height) / Math.min(width, height);
      if (aspectRatio > 20) {
        anomalies.push({
          anomaly_id: this.generateAnomalyId(),
          severity: 'MEDIUM',
          category: 'Technical/Manufacturing',
          detection_type: 'Extreme Aspect Ratio',
          details: {
            issue: `Part aspect ratio (${aspectRatio.toFixed(1)}:1) prone to warping`,
            location: 'Overall geometry',
            impact: 'Part will likely warp during processing',
            recommendation: 'Add stiffening features or warn customer'
          },
          risk_score: 5,
          auto_action: 'ADD_NOTE'
        });
      }
    }

    return anomalies;
  }

  /**
   * Business/Commercial Anomaly Detection
   */
  async detectBusinessAnomalies(quoteData) {
    const anomalies = [];
    const { customer, orderValue, quantity, rushOrder, deliveryAddress } = quoteData;

    // First-time large order
    if (customer.isFirstTime && orderValue > 10000) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Business/Commercial',
        detection_type: 'First-Time Large Order',
        details: {
          issue: `New customer requesting $${orderValue.toFixed(2)} order`,
          location: 'Customer profile',
          impact: 'High financial risk',
          recommendation: 'Require prepayment or credit check'
        },
        risk_score: 8,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    // Residential delivery for industrial parts
    if (deliveryAddress && deliveryAddress.type === 'residential' && 
        quoteData.partClassification === 'industrial') {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'MEDIUM',
        category: 'Business/Commercial',
        detection_type: 'Unusual Delivery Location',
        details: {
          issue: 'Industrial parts being delivered to residential address',
          location: 'Shipping information',
          impact: 'Possible unauthorized business operation',
          recommendation: 'Verify end-use and business legitimacy'
        },
        risk_score: 6,
        auto_action: 'ADD_NOTE'
      });
    }

    // Quantity mismatch
    if (quantity > 100 && quoteData.dxfAnalysis?.complexity === 'complex') {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'MEDIUM',
        category: 'Business/Commercial',
        detection_type: 'Quantity-Complexity Mismatch',
        details: {
          issue: `High quantity (${quantity}) for complex prototype-like part`,
          location: 'Order specifications',
          impact: 'Customer may not understand manufacturing implications',
          recommendation: 'Confirm quantity and suggest prototype run first'
        },
        risk_score: 5,
        auto_action: 'ADD_NOTE'
      });
    }

    // Competitor domain check
    const competitorDomains = ['competitor1.com', 'competitor2.com']; // Add real competitors
    if (customer.email && competitorDomains.some(domain => customer.email.includes(domain))) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Business/Commercial',
        detection_type: 'Competitor Inquiry',
        details: {
          issue: 'Quote request from competitor email domain',
          location: 'Customer information',
          impact: 'Competitive intelligence gathering',
          recommendation: 'Provide standard pricing only, no proprietary processes'
        },
        risk_score: 7,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    return anomalies;
  }

  /**
   * Pricing/Cost Anomaly Detection
   */
  async detectPricingAnomalies(quoteData) {
    const anomalies = [];
    const { materialCost, totalQuote, laborCost, complexity } = quoteData;

    // Material cost too high percentage
    const materialPercentage = (materialCost / totalQuote) * 100;
    if (materialPercentage > 80) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Pricing/Cost',
        detection_type: 'Low Margin Warning',
        details: {
          issue: `Material cost is ${materialPercentage.toFixed(1)}% of total quote`,
          location: 'Pricing calculation',
          impact: 'Insufficient margin for labor and overhead',
          recommendation: 'Review pricing or suggest alternative materials'
        },
        risk_score: 8,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    // Quote below material cost
    if (totalQuote < materialCost) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'CRITICAL',
        category: 'Pricing/Cost',
        detection_type: 'Negative Margin',
        details: {
          issue: 'Total quote is less than material cost',
          location: 'Pricing calculation',
          impact: 'Direct financial loss',
          recommendation: 'Recalculate immediately - possible formula error'
        },
        risk_score: 10,
        auto_action: 'HOLD_FOR_REVIEW'
      });
    }

    // Complexity vs price mismatch
    const expectedMultiplier = {
      'simple': 2.5,
      'moderate': 3.5,
      'complex': 5.0
    };
    const actualMultiplier = totalQuote / materialCost;
    const expectedMin = expectedMultiplier[complexity] * 0.8;
    
    if (actualMultiplier < expectedMin) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'MEDIUM',
        category: 'Pricing/Cost',
        detection_type: 'Complexity-Price Mismatch',
        details: {
          issue: `${complexity} part priced like simple part`,
          location: 'Pricing model',
          impact: 'Not capturing true cost of complexity',
          recommendation: 'Review complexity factors in pricing'
        },
        risk_score: 6,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    return anomalies;
  }

  /**
   * Pattern-Based Anomaly Detection
   */
  async detectPatternAnomalies(quoteData) {
    const anomalies = [];
    const { customer, timestamp, material, orderValue } = quoteData;

    // Check customer history patterns
    if (customer.history && customer.history.length > 5) {
      const avgOrderValue = customer.history.reduce((sum, order) => sum + order.value, 0) / customer.history.length;
      
      // Sudden order size change
      if (orderValue > avgOrderValue * 10) {
        anomalies.push({
          anomaly_id: this.generateAnomalyId(),
          severity: 'HIGH',
          category: 'Pattern-Based',
          detection_type: 'Order Size Anomaly',
          details: {
            issue: `Order 10x larger than customer average ($${avgOrderValue.toFixed(2)})`,
            location: 'Customer patterns',
            impact: 'Unusual behavior may indicate account compromise or error',
            recommendation: 'Confirm order details with customer'
          },
          risk_score: 7,
          auto_action: 'FLAG_FOR_REVIEW'
        });
      }

      // Material change
      const commonMaterial = this.getMostCommonMaterial(customer.history);
      if (commonMaterial && material !== commonMaterial && !material.includes(commonMaterial)) {
        anomalies.push({
          anomaly_id: this.generateAnomalyId(),
          severity: 'LOW',
          category: 'Pattern-Based',
          detection_type: 'Material Change',
          details: {
            issue: `Customer typically orders ${commonMaterial}, now requesting ${material}`,
            location: 'Material specification',
            impact: 'May indicate new application or mistake',
            recommendation: 'Confirm material selection is intentional'
          },
          risk_score: 3,
          auto_action: 'LOG_ONLY'
        });
      }
    }

    // Time-based anomalies
    const hour = new Date(timestamp).getHours();
    if (customer.type === 'business' && (hour < 6 || hour > 22)) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'LOW',
        category: 'Pattern-Based',
        detection_type: 'Unusual Timing',
        details: {
          issue: 'Business customer submitting quote at unusual hour',
          location: 'Submission time',
          impact: 'May indicate international customer or automated submission',
          recommendation: 'Monitor for bot behavior'
        },
        risk_score: 2,
        auto_action: 'LOG_ONLY'
      });
    }

    return anomalies;
  }

  /**
   * Security/Compliance Anomaly Detection
   */
  async detectComplianceAnomalies(quoteData) {
    const anomalies = [];
    const { dxfAnalysis, material, notes, fileName } = quoteData;

    // ITAR material check
    const itarMaterials = ['titanium', 'inconel', 'haselloy'];
    if (itarMaterials.some(m => material.toLowerCase().includes(m))) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Security/Compliance',
        detection_type: 'ITAR Material',
        details: {
          issue: `${material} may be subject to export controls`,
          location: 'Material specification',
          impact: 'Legal compliance required',
          recommendation: 'Verify customer export authorization'
        },
        risk_score: 8,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    // Check for weapon-like geometries
    if (dxfAnalysis && this.checkWeaponGeometry(dxfAnalysis)) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'CRITICAL',
        category: 'Security/Compliance',
        detection_type: 'Restricted Geometry',
        details: {
          issue: 'Part geometry resembles restricted item',
          location: 'Overall design',
          impact: 'Legal liability risk',
          recommendation: 'Require end-use certification before proceeding'
        },
        risk_score: 10,
        auto_action: 'HOLD_FOR_REVIEW'
      });
    }

    // Copyright/watermark check
    if (fileName && (fileName.includes('copyright') || fileName.includes('proprietary'))) {
      anomalies.push({
        anomaly_id: this.generateAnomalyId(),
        severity: 'HIGH',
        category: 'Security/Compliance',
        detection_type: 'Potential IP Issue',
        details: {
          issue: 'File name suggests copyrighted content',
          location: 'File metadata',
          impact: 'Intellectual property violation risk',
          recommendation: 'Verify customer owns design rights'
        },
        risk_score: 8,
        auto_action: 'FLAG_FOR_REVIEW'
      });
    }

    return anomalies;
  }

  /**
   * Helper Methods
   */
  generateAnomalyId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ANM-${dateStr}-${random}`;
  }

  getMostCommonMaterial(history) {
    const materials = history.map(h => h.material).filter(Boolean);
    const counts = materials.reduce((acc, mat) => {
      acc[mat] = (acc[mat] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
  }

  checkWeaponGeometry(dxfAnalysis) {
    // Simplified check - in production, use more sophisticated pattern matching
    const suspiciousPatterns = [
      'projectile-like aspect ratio',
      'barrel-like features',
      'trigger guard patterns'
    ];
    
    // Check for projectile-like shapes
    if (dxfAnalysis.boundingBox) {
      const { width, height } = dxfAnalysis.boundingBox;
      const ratio = Math.max(width, height) / Math.min(width, height);
      if (ratio > 10 && dxfAnalysis.holes.length < 2) {
        return true;
      }
    }
    
    return false;
  }

  determineAutoAction(anomalies) {
    const highestRisk = Math.max(...anomalies.map(a => a.risk_score), 0);
    
    if (highestRisk >= this.riskThresholds.CRITICAL) {
      return 'HOLD_QUOTE';
    } else if (highestRisk >= this.riskThresholds.HIGH) {
      return 'MANUAL_REVIEW_REQUIRED';
    } else if (highestRisk >= this.riskThresholds.MEDIUM) {
      return 'PROCEED_WITH_FLAGS';
    } else {
      return 'PROCEED_NORMAL';
    }
  }

  generateSummary(anomalies) {
    const criticalCount = anomalies.filter(a => a.risk_score >= this.riskThresholds.CRITICAL).length;
    const highCount = anomalies.filter(a => a.risk_score >= this.riskThresholds.HIGH && a.risk_score < this.riskThresholds.CRITICAL).length;
    
    if (criticalCount > 0) {
      return `CRITICAL: ${criticalCount} severe issue(s) require immediate attention`;
    } else if (highCount > 0) {
      return `WARNING: ${highCount} significant issue(s) need review before proceeding`;
    } else if (anomalies.length > 0) {
      return `INFO: ${anomalies.length} minor issue(s) logged for monitoring`;
    } else {
      return 'Quote appears normal - no anomalies detected';
    }
  }

  async logAnomalies(anomalies, quoteData) {
    // In production, save to database
    this.anomalyLog.push({
      timestamp: new Date(),
      quoteId: quoteData.id,
      customerId: quoteData.customer.id,
      anomalies: anomalies.map(a => ({
        id: a.anomaly_id,
        type: a.detection_type,
        score: a.risk_score
      }))
    });
    
    // Trim log if too large
    if (this.anomalyLog.length > 10000) {
      this.anomalyLog = this.anomalyLog.slice(-5000);
    }
  }
}

module.exports = new AnomalyDetectionService();