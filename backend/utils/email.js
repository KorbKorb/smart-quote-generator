const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production configuration (e.g., SendGrid, AWS SES)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development configuration (use Ethereal Email)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass',
      },
    });
  }
};

// Send email function
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart Quote Generator" <noreply@smartquote.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Strip HTML for text version
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcomeCustomer: (customer) => ({
    subject: 'Welcome to Smart Quote Generator',
    html: `
      <h1>Welcome ${customer.name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>You can now log in to the customer portal to:</p>
      <ul>
        <li>View and manage your quotes</li>
        <li>Accept or reject quotes online</li>
        <li>Track your order history</li>
        <li>Download invoices and documents</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `,
  }),

  quoteReady: (customer, quote) => ({
    subject: `Your Quote #${quote.quoteNumber} is Ready`,
    html: `
      <h1>Hi ${customer.name},</h1>
      <p>Your quote #${quote.quoteNumber} is ready for review.</p>
      <p><strong>Total: $${quote.totalPrice.toFixed(2)}</strong></p>
      <p>This quote is valid until ${new Date(quote.validUntil).toLocaleDateString()}.</p>
      <p><a href="${process.env.FRONTEND_URL}/portal/quotes/${quote._id}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Quote</a></p>
    `,
  }),

  quoteAccepted: (customer, quote) => ({
    subject: `Quote #${quote.quoteNumber} Accepted - Thank You!`,
    html: `
      <h1>Thank you for your order, ${customer.name}!</h1>
      <p>We've received your acceptance of quote #${quote.quoteNumber}.</p>
      <p>Order details:</p>
      <ul>
        <li>Quote Number: ${quote.quoteNumber}</li>
        <li>Total Amount: $${quote.totalPrice.toFixed(2)}</li>
        ${quote.purchaseOrderNumber ? `<li>PO Number: ${quote.purchaseOrderNumber}</li>` : ''}
      </ul>
      <p>We'll begin processing your order immediately and will keep you updated on its progress.</p>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};