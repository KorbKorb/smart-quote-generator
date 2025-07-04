// backend/src/config/anomalyDetectionConfig.js

module.exports = {
  /**
   * Anomaly Detection Configuration
   * Adjust these values based on your business rules
   */
  
  // Technical Thresholds
  technical: {
    minHoleToThicknessRatio: 1.0,     // Holes should be <= material thickness
    minBendRadiusMultiplier: 0.8,      // Bend radius = thickness * multiplier
    maxToleranceStandard: 0.005,       // Tightest standard tolerance
    maxSheetWidth: 48,                  // Standard sheet width in inches
    maxSheetLength: 96,                 // Standard sheet length in inches
    maxAspectRatio: 20,                 // Length/width ratio before warping risk
    maxFeatureDensity: 50,              // Features per square foot
    minHoleSpacingMultiplier: 1.5,     // Min spacing = (r1 + r2) * multiplier
    minMaterialThickness: {
      tappedHoles: 0.125,               // Min thickness for tapped holes
      countersinks: 0.0625              // Min thickness for countersinks
    }
  },
  
  // Business Rules
  business: {
    firstTimeLargeOrderThreshold: 10000,  // USD
    rushOrderPremium: 1.5,                 // 50% rush charge
    competitorDomains: [
      'competitor1.com',
      'competitor2.com',
      'metalshop3.com'
    ],
    suspiciousQuantityThreshold: {
      prototype: 10,                       // Max qty for complex parts
      simple: 10000                        // Max qty for simple parts
    },
    paymentTermsThresholds: {
      net30: 5000,                         // Max for net 30
      net60: 25000,                        // Max for net 60
      prepayment: 50000                    // Require prepayment above
    }
  },
  
  // Pricing Guards
  pricing: {
    minMarginPercentage: 20,               // Minimum acceptable margin
    materialCostMaxPercentage: 80,        // Max material cost % of total
    complexityMultipliers: {
      simple: 2.5,                         // Total = material * multiplier
      moderate: 3.5,
      complex: 5.0
    },
    setupCharges: {
      minimum: 50,                         // Minimum setup charge
      perBend: 10,                         // Per bend setup
      perTool: 25                          // Per tool change
    },
    quantityBreaks: [
      { qty: 1, discount: 0 },
      { qty: 10, discount: 0.1 },
      { qty: 50, discount: 0.15 },
      { qty: 100, discount: 0.2 },
      { qty: 500, discount: 0.25 },
      { qty: 1000, discount: 0.3 }
    ]
  },
  
  // Pattern Detection
  patterns: {
    orderSizeVarianceThreshold: 10,       // Flag if 10x normal
    materialChangeTracking: true,
    unusualHours: {
      start: 22,                           // 10 PM
      end: 6                               // 6 AM
    },
    quotesPerHourLimit: 10,               // Bot detection
    seasonalProducts: {
      'snow-guards': { season: 'winter', months: [10, 11, 12, 1, 2] },
      'ac-brackets': { season: 'summer', months: [4, 5, 6, 7, 8] }
    }
  },
  
  // Compliance & Security
  compliance: {
    itarMaterials: [
      'titanium',
      'inconel',
      'hastelloy',
      'tungsten',
      'depleted uranium'  // Should never see this!
    ],
    restrictedGeometries: [
      'projectile',
      'barrel',
      'receiver',
      'trigger'
    ],
    exportControlCountries: [
      'Iran',
      'North Korea',
      'Syria',
      'Cuba'
    ],
    maxPartWeight: 500,                    // lbs - flag heavy parts
    copyrightKeywords: [
      'copyright',
      'proprietary',
      'confidential',
      'patent pending',
      'trade secret'
    ]
  },
  
  // Risk Scoring
  riskScoring: {
    weights: {
      technical: 1.0,
      business: 0.9,
      pricing: 0.8,
      pattern: 0.6,
      compliance: 1.2
    },
    thresholds: {
      critical: 9,
      high: 7,
      medium: 4,
      low: 1
    },
    autoActions: {
      10: 'IMMEDIATE_HALT',
      9: 'HOLD_FOR_REVIEW',
      7: 'FLAG_FOR_REVIEW',
      4: 'ADD_NOTES',
      1: 'LOG_ONLY'
    }
  },
  
  // Machine Learning Parameters
  ml: {
    enableLearning: true,
    falsePositiveThreshold: 0.3,          // 30% false positive rate triggers retraining
    minDataPoints: 100,                   // Min samples before ML kicks in
    retrainInterval: 7,                   // Days between retraining
    anomalyHistoryDays: 90                // Days of history to consider
  },
  
  // Notification Settings
  notifications: {
    criticalAlerts: {
      email: ['manager@company.com', 'owner@company.com'],
      sms: ['+1234567890'],
      slack: '#critical-alerts'
    },
    highAlerts: {
      email: ['sales-manager@company.com'],
      slack: '#quote-reviews'
    },
    reportSchedule: 'daily',               // 'hourly', 'daily', 'weekly'
    dashboardRefresh: 300                  // seconds
  },
  
  // Special Process Flags
  specialProcesses: {
    precisionMachining: ['CNC', 'EDM', 'grinding'],
    specialCoatings: ['PTFE', 'ceramic', 'chrome'],
    heatTreatment: ['annealing', 'tempering', 'case hardening'],
    certification: ['CERT', 'MTR', 'PPAP']
  }
};

/**
 * Helper function to get config value with fallback
 */
function getConfigValue(path, defaultValue) {
  const keys = path.split('.');
  let value = module.exports;
  
  for (const key of keys) {
    if (value && value.hasOwnProperty(key)) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

module.exports.getConfigValue = getConfigValue;