# ML-Enhanced Anomaly Detection System Documentation

## Overview

The Smart Quote Generator's ML-Enhanced Anomaly Detection System combines traditional rule-based detection with advanced machine learning to identify potential issues, risks, and opportunities in sheet metal fabrication quotes. The system learns from every quote, continuously improving its accuracy and adapting to changing market conditions.

## Architecture

### Components

1. **ML Integration Service** (`MLIntegration.js`)
   - Orchestrates ML and rule-based detection
   - Manages model lifecycle
   - Handles feedback processing
   - Provides unified API

2. **ML Anomaly Detection Service** (`MLAnomalyDetectionService.js`)
   - Neural networks for technical anomalies
   - Isolation Forest for customer behavior
   - Random Forest for pricing anomalies
   - LSTM for temporal patterns
   - Ensemble voting mechanism

3. **Feature Engineering** (`featureEngineering.js`)
   - Extracts 100+ features across 7 categories
   - Handles normalization and encoding
   - Tracks feature importance
   - Manages feature drift

4. **Model Training Service** (`modelTraining.js`)
   - Automated model training pipeline
   - Hyperparameter optimization
   - Model versioning and rollback
   - Performance evaluation

5. **Model Monitoring** (`modelMonitoring.js`)
   - Real-time performance tracking
   - Drift detection
   - Alert generation
   - Business impact calculation

## Feature Categories

### 1. Geometric Features (15 features)
- Area, perimeter, bounding box
- Shape complexity metrics
- Hole patterns and density
- Bend line analysis
- Nesting efficiency

### 2. Material Features (12 features)
- Material properties (density, strength)
- Cost indices
- Process compatibility
- Special handling requirements

### 3. Manufacturing Features (10 features)
- Setup complexity
- Process time estimates
- Tolerance requirements
- Risk assessments

### 4. Customer Features (12 features)
- Order history patterns
- Payment behavior
- Industry classification
- Engagement metrics

### 5. Temporal Features (14 features)
- Cyclical time encoding
- Business hour indicators
- Seasonal patterns
- Rush order flags

### 6. Market Features (10 features)
- Material price indices
- Capacity utilization
- Competition indicators
- Economic factors

### 7. Interaction Features (8 features)
- Cross-feature combinations
- Risk multipliers
- Cost drivers

## Models

### Technical Anomaly Model
- **Type**: Deep Neural Network
- **Architecture**: 4 layers (64-32-16-1)
- **Activation**: ReLU with sigmoid output
- **Regularization**: L2 + Dropout
- **Purpose**: Detect manufacturing impossibilities

### Customer Behavior Model
- **Type**: Isolation Forest
- **Parameters**: 100 estimators, 10% contamination
- **Purpose**: Identify unusual order patterns

### Pricing Model
- **Type**: Random Forest Regressor
- **Parameters**: 50 trees, max depth 10
- **Purpose**: Detect pricing anomalies

### Temporal Model
- **Type**: LSTM Network
- **Architecture**: 2 LSTM layers (32-16)
- **Purpose**: Capture time-based patterns

### Ensemble Model
- **Type**: Meta-learner Neural Network
- **Voting**: Weighted by confidence
- **Purpose**: Combine all model predictions

## Detection Flow

```
1. Quote Input
   ↓
2. Feature Extraction (< 100ms)
   ↓
3. Parallel Processing:
   - Rule-based Detection
   - ML Inference
   ↓
4. Result Combination
   ↓
5. Risk Scoring & Explanation
   ↓
6. Action Determination
```

## Risk Scoring

### Score Ranges
- **0-1**: Minimal risk (proceed normally)
- **1-4**: Low risk (log for monitoring)
- **4-7**: Medium risk (add caution flags)
- **7-9**: High risk (require review)
- **9-10**: Critical risk (halt processing)

### Factors
- Technical impossibilities (weight: 0.3)
- Customer anomalies (weight: 0.2)
- Pricing issues (weight: 0.25)
- Temporal patterns (weight: 0.25)

## Continuous Learning

### Feedback Loop
1. **Quote Outcome**: Win/loss updates pricing models
2. **Production Data**: Actual vs estimated refines predictions
3. **Quality Reports**: Links features to issues
4. **User Overrides**: Captures expert knowledge

### Retraining Schedule
- **Real-time**: Critical feature updates
- **Daily**: Customer profile updates
- **Weekly**: Deep model retraining
- **Monthly**: Full architecture review

## Performance Metrics

### Model Metrics
- **Accuracy**: Target > 85%
- **Precision**: Target > 80%
- **Recall**: Target > 75%
- **F1 Score**: Target > 78%
- **Latency**: Target < 1000ms

### Business Metrics
- **Prevented Losses**: Track $ saved
- **False Positive Rate**: Target < 15%
- **ROI**: Target > 300%
- **Processing Time**: < 1 second

## API Endpoints

### Core Endpoints
- `POST /api/quotes/analyze` - Analyze quote with ML
- `GET /api/ml/metrics` - Get performance metrics
- `POST /api/ml/feedback` - Submit outcome feedback
- `GET /api/ml/alerts` - Get active alerts
- `POST /api/ml/retrain` - Trigger retraining

### WebSocket
- `ws://localhost:3001/ml-metrics` - Real-time metrics stream

## Dashboard Features

### Real-time Monitoring
- Live risk scores
- Performance metrics
- Active alerts
- Processing latency

### Analytics
- Confusion matrix
- Feature importance
- Drift analysis
- ROI calculation

### Insights
- Automated recommendations
- Pattern detection
- Trend analysis
- Business impact

## Configuration

### Thresholds (Adjustable)
```javascript
{
  accuracy: 0.85,
  precision: 0.80,
  recall: 0.75,
  f1Score: 0.78,
  latency: 1000,
  driftScore: 0.15,
  falsePositiveRate: 0.15
}
```

### Feature Weights
```javascript
{
  technical: 0.3,
  customer: 0.2,
  pricing: 0.25,
  temporal: 0.25
}
```

## Best Practices

### 1. Data Quality
- Ensure complete DXF analysis
- Maintain customer history
- Track actual outcomes
- Label anomalies correctly

### 2. Model Management
- Monitor drift continuously
- Retrain on schedule
- Version all models
- Test before deployment

### 3. Business Integration
- Review high-risk quotes manually
- Track false positives
- Gather user feedback
- Calculate ROI regularly

### 4. Performance Optimization
- Cache frequent predictions
- Batch similar requests
- Use feature selection
- Optimize model size

## Troubleshooting

### High False Positives
1. Check drift scores
2. Review recent overrides
3. Adjust sensitivity
4. Retrain if needed

### Poor Performance
1. Check feature quality
2. Review model metrics
3. Analyze error patterns
4. Consider architecture changes

### Slow Response
1. Profile feature extraction
2. Check model complexity
3. Review infrastructure
4. Consider caching

## Future Enhancements

### Planned Features
1. **AutoML Integration**: Automated architecture search
2. **Explainable AI**: SHAP/LIME integration
3. **Multi-model A/B Testing**: Champion/challenger framework
4. **Advanced Visualizations**: 3D anomaly spaces
5. **Industry Benchmarking**: Comparative analytics

### Research Areas
1. Graph neural networks for part relationships
2. Reinforcement learning for pricing optimization
3. Federated learning for privacy-preserving insights
4. Quantum-inspired optimization algorithms

## Security Considerations

### Data Protection
- Encrypt model files at rest
- Secure API endpoints
- Audit all predictions
- Anonymize training data

### Access Control
- Role-based permissions
- API rate limiting
- Audit logging
- Secure model storage

## Support

For questions or issues:
1. Check logs in `/backend/logs/ml/`
2. Review metrics dashboard
3. Contact ML team
4. Submit feedback through system

---

**Version**: 2.3.1  
**Last Updated**: January 2025  
**Maintained By**: ML Team