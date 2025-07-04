// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send quote email with PDF attachment
   */
  async sendQuoteEmail(quote, pdfPath, recipientEmail) {
    try {
      // Read PDF file
      const pdfBuffer = await fs.readFile(pdfPath);
      
      const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'Smart Manufacturing Co.'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail || quote.customer.email,
        subject: `Quote #${quote._id} - ${quote.customer.company || quote.customer.name}`,
        html: this.getEmailTemplate(quote),
        attachments: [
          {
            filename: `quote_${quote._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get email HTML template
   */
  getEmailTemplate(quote) {
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .quote-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Quote is Ready!</h1>
  </div>
  
  <div class="content">
    <p>Dear ${quote.customer.name},</p>
    
    <p>Thank you for your interest in our sheet metal fabrication services. We're pleased to provide you with a detailed quote for your project.</p>
    
    <div class="quote-details">
      <h2>Quote Summary</h2>
      <p><strong>Quote ID:</strong> #${quote._id}</p>
      <p><strong>Total Amount:</strong> $${parseFloat(quote.totalPrice).toFixed(2)}</p>
      <p><strong>Valid Until:</strong> ${validUntil}</p>
      <p><strong>Items:</strong> ${quote.items.length} part(s)</p>
    </div>
    
    <p>Please find the detailed quote attached to this email as a PDF document. The quote includes:</p>
    <ul>
      <li>Complete pricing breakdown</li>
      <li>Part specifications</li>
      <li>Terms and conditions</li>
      <li>QR code for easy online acceptance</li>
    </ul>
    
    <center>
      <a href="${process.env.FRONTEND_URL}/quotes/${quote._id}" class="cta-button">
        View Quote Online
      </a>
    </center>
    
    <p>If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.</p>
    
    <p>Best regards,<br>
    The Smart Manufacturing Team</p>
  </div>
  
  <div class="footer">
    <p>Smart Manufacturing Co.<br>
    123 Industrial Way, Chicago, IL 60601<br>
    Phone: (555) 123-4567 | Email: quotes@smartmfg.com</p>
    
    <p style="font-size: 12px; color: #999;">
      This email and any attachments are confidential and intended solely for the addressee.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send quote follow-up reminder
   */
  async sendFollowUpEmail(quote) {
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Smart Manufacturing Co.'}" <${process.env.SMTP_USER}>`,
      to: quote.customer.email,
      subject: `Reminder: Quote #${quote._id} expires soon`,
      html: `
        <p>Dear ${quote.customer.name},</p>
        <p>This is a friendly reminder that your quote #${quote._id} will expire soon.</p>
        <p>Total Amount: $${parseFloat(quote.totalPrice).toFixed(2)}</p>
        <p><a href="${process.env.FRONTEND_URL}/quotes/${quote._id}">View Quote</a></p>
        <p>Best regards,<br>Smart Manufacturing Team</p>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
