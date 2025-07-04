const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    name: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'US',
    },
    phone: String,
    website: String,
  },
  phone: {
    type: String,
    trim: true,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    preferredCurrency: {
      type: String,
      default: 'USD',
    },
    preferredUnits: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'imperial',
    },
  },
  billing: {
    addresses: [{
      label: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: Boolean,
    }],
    paymentMethods: [{
      type: String,
      last4: String,
      expiryMonth: Number,
      expiryYear: Number,
      isDefault: Boolean,
    }],
    creditLimit: {
      type: Number,
      default: 0,
    },
    netTerms: {
      type: Number,
      default: 0, // 0 means payment on delivery
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for lock status
customerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt timestamp
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare password
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to handle failed login attempts
customerSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account after 5 attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
customerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Instance method to generate password reset token
customerSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Static method to find by credentials
customerSchema.statics.findByCredentials = async function(email, password) {
  const customer = await this.findOne({ email });
  
  if (!customer) {
    throw new Error('Invalid login credentials');
  }
  
  // Check if account is locked
  if (customer.isLocked) {
    throw new Error('Account is locked due to too many failed login attempts');
  }
  
  const isMatch = await customer.comparePassword(password);
  
  if (!isMatch) {
    await customer.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  await customer.resetLoginAttempts();
  
  return customer;
};

// Add index for email
customerSchema.index({ email: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;