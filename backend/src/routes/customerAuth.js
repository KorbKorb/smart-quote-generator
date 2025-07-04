// backend/src/routes/customerAuth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Customer = require('../models/Customer');
const { generateToken, authenticateCustomer } = require('../middleware/customerAuth');
const emailService = require('../utils/emailService');

// Register new customer
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      company,
      firstName,
      lastName,
      phone,
      role
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new customer
    const customer = new Customer({
      email,
      password,
      company: {
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        zip: company.zip,
        phone: company.phone,
        website: company.website
      },
      contactPerson: {
        firstName,
        lastName,
        phone,
        role
      }
    });

    // Generate verification token
    const verificationToken = customer.generateVerificationToken();
    await customer.save();

    // Send verification email
    await emailService.sendVerificationEmail(customer, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      customerId: customer._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register. Please try again.' });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const customer = await Customer.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    customer.isVerified = true;
    customer.verificationToken = undefined;
    customer.verificationExpires = undefined;
    await customer.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find customer
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (customer.isLocked) {
      return res.status(423).json({
        error: 'Account is locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if email is verified
    if (!customer.isVerified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    // Check if account is active
    if (customer.status !== 'active') {
      return res.status(401).json({ error: 'Your account has been suspended' });
    }

    // Validate password
    const isValidPassword = await customer.comparePassword(password);
    if (!isValidPassword) {
      await customer.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts and update last login
    await customer.resetLoginAttempts();
    customer.lastLogin = new Date();
    await customer.save();

    // Generate token
    const token = generateToken(customer._id);

    // Send response
    res.json({
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        company: customer.company,
        contactPerson: customer.contactPerson,
        preferences: customer.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = customer.generatePasswordResetToken();
    await customer.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(customer, resetToken);

    res.json({ message: 'If an account exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const customer = await Customer.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    customer.password = password;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;
    await customer.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current customer
router.get('/me', authenticateCustomer, async (req, res) => {
  res.json({
    customer: {
      id: req.customer._id,
      email: req.customer.email,
      company: req.customer.company,
      contactPerson: req.customer.contactPerson,
      preferences: req.customer.preferences,
      isVerified: req.customer.isVerified,
      createdAt: req.customer.createdAt
    }
  });
});

// Update profile
router.patch('/profile', authenticateCustomer, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['company', 'contactPerson', 'preferences'];
    
    // Filter out non-allowed updates
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    // Update customer
    Object.assign(req.customer, updates);
    await req.customer.save();

    res.json({
      message: 'Profile updated successfully',
      customer: {
        id: req.customer._id,
        email: req.customer.email,
        company: req.customer.company,
        contactPerson: req.customer.contactPerson,
        preferences: req.customer.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', authenticateCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get customer with password field
    const customer = await Customer.findById(req.customer._id);

    // Verify current password
    const isValid = await customer.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer || customer.isVerified) {
      return res.json({ message: 'If an unverified account exists, a verification email has been sent.' });
    }

    // Generate new verification token
    const verificationToken = customer.generateVerificationToken();
    await customer.save();

    // Send verification email
    await emailService.sendVerificationEmail(customer, verificationToken);

    res.json({ message: 'If an unverified account exists, a verification email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;
