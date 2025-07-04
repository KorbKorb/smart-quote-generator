const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const { sendEmail } = require('../utils/email');
const { customerAuth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (customerId) => {
  return jwt.sign(
    { id: customerId, type: 'customer' },
    process.env.JWT_SECRET_CUSTOMER || 'customer-secret-key',
    { expiresIn: '7d' }
  );
};

// Register new customer
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company, phone } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new customer
    const customer = new Customer({
      email,
      password,
      name,
      company,
      phone,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    });

    await customer.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/portal/verify-email?token=${customer.emailVerificationToken}`;
    await sendEmail({
      to: customer.email,
      subject: 'Verify Your Email - Smart Quote Generator',
      html: `
        <h1>Welcome to Smart Quote Generator!</h1>
        <p>Hi ${customer.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        emailVerified: customer.emailVerified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findByCredentials(email, password);

    if (customer.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    const token = generateToken(customer._id);

    res.json({
      success: true,
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        emailVerified: customer.emailVerified,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid login credentials',
    });
  }
});

// Logout (optional - mainly for tracking)
router.post('/logout', customerAuth, async (req, res) => {
  try {
    // You could blacklist the token here if needed
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

// Verify token
router.get('/verify', customerAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer._id,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        emailVerified: customer.emailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
    });
  }
});

// Forgot password
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    customer.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    customer.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await customer.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/portal/reset-password?token=${resetToken}`;
    await sendEmail({
      to: customer.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${customer.name},</p>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <a href="${resetUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
    });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash token to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const customer = await Customer.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password
    customer.password = newPassword;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const customer = await Customer.findOne({
      emailVerificationToken: token,
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
      });
    }

    customer.emailVerified = true;
    customer.emailVerificationToken = undefined;
    await customer.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    if (customer.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new verification token
    customer.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await customer.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/portal/verify-email?token=${customer.emailVerificationToken}`;
    await sendEmail({
      to: customer.email,
      subject: 'Verify Your Email - Smart Quote Generator',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${customer.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
    });
  }
});

module.exports = router;