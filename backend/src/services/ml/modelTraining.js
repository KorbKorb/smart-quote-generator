// backend/src/services/ml/modelTraining.js

const tf = require('@tensorflow/tfjs-node');
const { RandomForestRegressor } = require('ml-random-forest');
const { IsolationForest } = require('isolation-forest');
const fs = require('fs').promises;
const path = require('path');

class ModelTrainingService {
  constructor() {
    this.models = {
      technical: null,
      customer: null,
      pricing: null,
      temporal: null,
      ensemble: null
    };
    
    this.trainingData = {
      features: [],
      labels: [],
      metadata: []
    };
    
    this.modelPath = path.join(__dirname, '../../../models');
    this.config = {
      batchSize: 32,
      epochs: 100,
      validationSplit: 0.2,
      earlyStoppingPatience: 10,
      learningRate: 0.001
    };
  }

  /**
   * Initialize or load existing models
   */
  async initialize() {
    try {
      // Ensure model directory exists
      await fs.mkdir(this.modelPath, { recursive: true });
      
      // Try to load existing models
      await this.loadModels();
      
      // If no models exist, create base models
      if (!this.models.technical) {
        await this.createBaseModels();
      }
      
      console.log('Model training service initialized');
    } catch (error) {
      console.error('Error initializing model training:', error);
      throw error;
    }
  }

  /**
   * Train all models with new data
   */
  async trainModels(trainingData) {
    console.log(`Starting model training with ${trainingData.length} samples...`);
    
    try {
      // Prepare datasets
      const datasets = await this.prepareDatasets(trainingData);
      
      // Train individual models
      const results = {
        technical: await this.trainTechnicalModel(datasets.technical),
        customer: await this.trainCustomerModel(datasets.customer),
        pricing: await this.trainPricingModel(datasets.pricing),
        temporal: await this.trainTemporalModel(datasets.temporal),
        ensemble: await this.trainEnsembleModel(datasets.combined)
      };
      
      // Save trained models
      await this.saveModels();
      
      // Generate training report
      const report = this.generateTrainingReport(results);
      
      return report;
      
    } catch (error) {
      console.error('Error during model training:', error);
      throw error;
    }
  }

  /**
   * Prepare datasets for training
   */
  async prepareDatasets(rawData) {
    const datasets = {
      technical: { features: [], labels: [] },
      customer: { features: [], labels: [] },
      pricing: { features: [], labels: [] },
      temporal: { features: [], labels: [] },
      combined: { features: [], labels: [] }
    };
    
    for (const sample of rawData) {
      // Extract features using feature engineering
      const features = sample.features;
      const label = this.createLabel(sample.outcome);
      
      // Technical dataset
      datasets.technical.features.push(Object.values(features.geometric));
      datasets.technical.labels.push(label.technical);
      
      // Customer dataset
      datasets.customer.features.push(Object.values(features.customer));
      datasets.customer.labels.push(label.customer);
      
      // Pricing dataset
      datasets.pricing.features.push(Object.values(features.pricing));
      datasets.pricing.labels.push(label.pricing);
      
      // Temporal dataset
      datasets.temporal.features.push(Object.values(features.temporal));
      datasets.temporal.labels.push(label.temporal);
      
      // Combined dataset for ensemble
      const combinedFeatures = [
        ...Object.values(features.geometric),
        ...Object.values(features.customer),
        ...Object.values(features.pricing),
        ...Object.values(features.temporal)
      ];
      datasets.combined.features.push(combinedFeatures);
      datasets.combined.labels.push(label.overall);
    }
    
    return datasets;
  }

  /**
   * Create label from outcome data
   */
  createLabel(outcome) {
    return {
      technical: outcome.technicalIssues ? 1 : 0,
      customer: outcome.customerIssues ? 1 : 0,
      pricing: outcome.pricingIssues ? 1 : 0,
      temporal: outcome.timingIssues ? 1 : 0,
      overall: outcome.hadIssues ? 1 : 0
    };
  }

  /**
   * Train technical anomaly detection model
   */
  async trainTechnicalModel(dataset) {
    console.log('Training technical model...');
    
    // Create neural network for technical anomaly detection
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [dataset.features[0].length],
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
    
    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    // Convert data to tensors
    const features = tf.tensor2d(dataset.features);
    const labels = tf.tensor2d(dataset.labels, [dataset.labels.length, 1]);
    
    // Train model
    const history = await model.fit(features, labels, {
      epochs: this.config.epochs,
      batchSize: this.config.batchSize,
      validationSplit: this.config.validationSplit,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          }
        },
        earlyStopping: tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: this.config.earlyStoppingPatience
        })
      }
    });
    
    // Clean up tensors
    features.dispose();
    labels.dispose();
    
    // Store model
    this.models.technical = model;
    
    return {
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalAccuracy: history.history.acc[history.history.acc.length - 1],
      epochs: history.history.loss.length
    };
  }

  /**
   * Train customer anomaly model using Isolation Forest
   */
  async trainCustomerModel(dataset) {
    console.log('Training customer model...');
    
    // Use Isolation Forest for unsupervised anomaly detection
    const model = new IsolationForest({
      nEstimators: 100,
      maxSamples: Math.min(256, dataset.features.length),
      contamination: 0.1,
      randomState: 42
    });
    
    // Fit the model
    model.fit(dataset.features);
    
    // Evaluate on training data
    const scores = model.anomalyScore(dataset.features);
    const predictions = scores.map(score => score > 0.5 ? 1 : 0);
    
    // Calculate metrics
    const accuracy = this.calculateAccuracy(predictions, dataset.labels);
    
    // Store model
    this.models.customer = model;
    
    return {
      accuracy,
      contamination: 0.1,
      nEstimators: 100
    };
  }

  /**
   * Train pricing model with market awareness
   */
  async trainPricingModel(dataset) {
    console.log('Training pricing model...');
    
    // Use Random Forest for pricing anomaly detection
    const options = {
      seed: 42,
      maxFeatures: 0.8,
      nEstimators: 50,
      maxDepth: 10,
      minNumSamples: 3
    };
    
    const model = new RandomForestRegressor(options);
    model.train(dataset.features, dataset.labels);
    
    // Evaluate model
    const predictions = model.predict(dataset.features);
    const mse = this.calculateMSE(predictions, dataset.labels);
    
    // Store model
    this.models.pricing = model;
    
    return {
      mse,
      nEstimators: options.nEstimators,
      maxDepth: options.maxDepth
    };
  }

  /**
   * Train temporal pattern model
   */
  async trainTemporalModel(dataset) {
    console.log('Training temporal model...');
    
    // LSTM for temporal patterns
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 32,
          returnSequences: true,
          inputShape: [1, dataset.features[0].length]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 16,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 8,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    // Reshape data for LSTM (add time dimension)
    const features = tf.tensor3d(
      dataset.features.map(f => [f]),
      [dataset.features.length, 1, dataset.features[0].length]
    );
    const labels = tf.tensor2d(dataset.labels, [dataset.labels.length, 1]);
    
    // Train model
    const history = await model.fit(features, labels, {
      epochs: this.config.epochs,
      batchSize: this.config.batchSize,
      validationSplit: this.config.validationSplit,
      verbose: 0
    });
    
    // Clean up
    features.dispose();
    labels.dispose();
    
    // Store model
    this.models.temporal = model;
    
    return {
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalAccuracy: history.history.acc[history.history.acc.length - 1]
    };
  }

  /**
   * Train ensemble meta-model
   */
  async trainEnsembleModel(dataset) {
    console.log('Training ensemble model...');
    
    // Meta-learner that combines predictions from other models
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [dataset.features[0].length],
          units: 128,
          activation: 'relu'
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate * 0.5),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    const features = tf.tensor2d(dataset.features);
    const labels = tf.tensor2d(dataset.labels, [dataset.labels.length, 1]);
    
    const history = await model.fit(features, labels, {
      epochs: this.config.epochs * 1.5,
      batchSize: this.config.batchSize,
      validationSplit: this.config.validationSplit,
      callbacks: {
        earlyStopping: tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: this.config.earlyStoppingPatience * 1.5,
          restoreBestWeights: true
        })
      },
      verbose: 0
    });
    
    features.dispose();
    labels.dispose();
    
    this.models.ensemble = model;
    
    return {
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalAccuracy: history.history.acc[history.history.acc.length - 1],
      finalPrecision: history.history.precision[history.history.precision.length - 1],
      finalRecall: history.history.recall[history.history.recall.length - 1]
    };
  }

  /**
   * Save all models to disk
   */
  async saveModels() {
    console.log('Saving models...');
    
    try {
      // Save TensorFlow models
      if (this.models.technical) {
        await this.models.technical.save(`file://${this.modelPath}/technical`);
      }
      
      if (this.models.temporal) {
        await this.models.temporal.save(`file://${this.modelPath}/temporal`);
      }
      
      if (this.models.ensemble) {
        await this.models.ensemble.save(`file://${this.modelPath}/ensemble`);
      }
      
      // Save sklearn-like models as JSON
      if (this.models.customer) {
        const customerData = JSON.stringify(this.models.customer);
        await fs.writeFile(
          path.join(this.modelPath, 'customer.json'),
          customerData
        );
      }
      
      if (this.models.pricing) {
        const pricingData = JSON.stringify(this.models.pricing);
        await fs.writeFile(
          path.join(this.modelPath, 'pricing.json'),
          pricingData
        );
      }
      
      // Save metadata
      const metadata = {
        version: '2.3.1',
        trainedAt: new Date().toISOString(),
        config: this.config,
        performance: await this.evaluateModels()
      };
      
      await fs.writeFile(
        path.join(this.modelPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log('Models saved successfully');
      
    } catch (error) {
      console.error('Error saving models:', error);
      throw error;
    }
  }

  /**
   * Load models from disk
   */
  async loadModels() {
    console.log('Loading models...');
    
    try {
      // Load TensorFlow models
      const technicalPath = path.join(this.modelPath, 'technical', 'model.json');
      if (await this.fileExists(technicalPath)) {
        this.models.technical = await tf.loadLayersModel(`file://${technicalPath}`);
      }
      
      const temporalPath = path.join(this.modelPath, 'temporal', 'model.json');
      if (await this.fileExists(temporalPath)) {
        this.models.temporal = await tf.loadLayersModel(`file://${temporalPath}`);
      }
      
      const ensemblePath = path.join(this.modelPath, 'ensemble', 'model.json');
      if (await this.fileExists(ensemblePath)) {
        this.models.ensemble = await tf.loadLayersModel(`file://${ensemblePath}`);
      }
      
      // Load other models from JSON
      // Note: In production, you'd need to properly deserialize these models
      
      console.log('Models loaded successfully');
      
    } catch (error) {
      console.error('Error loading models:', error);
      // Continue with fresh models if loading fails
    }
  }

  /**
   * Evaluate all models
   */
  async evaluateModels() {
    const evaluation = {};
    
    if (this.models.technical) {
      evaluation.technical = {
        parameters: this.models.technical.countParams(),
        layers: this.models.technical.layers.length
      };
    }
    
    // Add evaluations for other models
    
    return evaluation;
  }

  /**
   * Generate comprehensive training report
   */
  generateTrainingReport(results) {
    return {
      timestamp: new Date().toISOString(),
      models: results,
      summary: {
        overallSuccess: Object.values(results).every(r => r.finalAccuracy > 0.8 || r.accuracy > 0.8),
        recommendations: this.generateRecommendations(results)
      }
    };
  }

  /**
   * Generate training recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    // Check technical model
    if (results.technical.finalAccuracy < 0.85) {
      recommendations.push('Consider adding more technical training data or adjusting model architecture');
    }
    
    // Check customer model
    if (results.customer.accuracy < 0.80) {
      recommendations.push('Customer model needs more diverse examples');
    }
    
    // Add more recommendation logic
    
    return recommendations;
  }

  /**
   * Utility methods
   */
  
  calculateAccuracy(predictions, labels) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) correct++;
    }
    return correct / predictions.length;
  }
  
  calculateMSE(predictions, labels) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.pow(predictions[i] - labels[i], 2);
    }
    return sum / predictions.length;
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Create base models for cold start
   */
  async createBaseModels() {
    console.log('Creating base models for cold start...');
    
    // Generate synthetic training data
    const syntheticData = this.generateSyntheticData(1000);
    
    // Train with synthetic data
    await this.trainModels(syntheticData);
  }
  
  /**
   * Generate synthetic training data for cold start
   */
  generateSyntheticData(count) {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      data.push({
        features: {
          geometric: this.generateRandomFeatures(15),
          customer: this.generateRandomFeatures(12),
          pricing: this.generateRandomFeatures(10),
          temporal: this.generateRandomFeatures(14)
        },
        outcome: {
          hadIssues: Math.random() > 0.8,
          technicalIssues: Math.random() > 0.9,
          customerIssues: Math.random() > 0.85,
          pricingIssues: Math.random() > 0.8,
          timingIssues: Math.random() > 0.9
        }
      });
    }
    
    return data;
  }
  
  generateRandomFeatures(count) {
    const features = {};
    for (let i = 0; i < count; i++) {
      features[`feature_${i}`] = Math.random();
    }
    return features;
  }
}

module.exports = new ModelTrainingService();