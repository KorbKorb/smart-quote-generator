// backend/src/utils/pdfGenerator.js
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

class PDFGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.uploadsDir = path.join(__dirname, '../../uploads/quotes');
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Ensure uploads directory exists
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  /**
   * Generate PDF quote
   */
  async generateQuotePDF(quote) {
    try {
      // Generate QR code for quote acceptance
      const qrCodeUrl = await this.generateQRCode(quote._id);
      
      // Prepare template data
      const templateData = {
        quote,
        qrCodeUrl,
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        companyInfo: {
          name: 'Smart Manufacturing Co.',
          address: '123 Industrial Way',
          city: 'Chicago, IL 60601',
          phone: '(555) 123-4567',
          email: 'quotes@smartmfg.com',
          website: 'www.smartmfg.com',
          logo: await this.getBase64Logo()
        },
        // Format currency helper
        formatCurrency: (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(parseFloat(amount) || 0);
        }
      };

      // Load and compile template
      const htmlTemplate = await this.loadTemplate();
      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set content and wait for rendering
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();

      // Save PDF to file
      const filename = `quote_${quote._id}_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadsDir, filename);
      await fs.writeFile(filepath, pdfBuffer);

      return {
        filename,
        filepath,
        buffer: pdfBuffer
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for quote acceptance
   */
  async generateQRCode(quoteId) {
    try {
      const url = `${this.baseUrl}/quotes/${quoteId}/accept`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  /**
   * Get company logo as base64
   */
  async getBase64Logo() {
    try {
      // For now, return a placeholder SVG logo
      // In production, read actual logo file
      const svgLogo = `
        <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="60" fill="#667eea" rx="8"/>
          <text x="100" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
            Smart MFG
          </text>
        </svg>
      `;
      const base64 = Buffer.from(svgLogo).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load HTML template
   */
  async loadTemplate() {
    // Return inline template for now
    // In production, load from file
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .company-info h1 {
      color: #667eea;
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .company-info p {
      color: #6b7280;
      font-size: 14px;
      margin: 2px 0;
    }
    
    .logo {
      max-width: 200px;
      max-height: 60px;
    }
    
    /* Quote Header */
    .quote-header {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .quote-title {
      font-size: 28px;
      color: #111827;
      margin-bottom: 10px;
    }
    
    .quote-meta {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .quote-meta-item {
      flex: 1;
      min-width: 150px;
    }
    
    .quote-meta-item label {
      display: block;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .quote-meta-item value {
      display: block;
      font-size: 16px;
      color: #111827;
      font-weight: 600;
    }
    
    /* Customer Info */
    .customer-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      color: #374151;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .customer-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .customer-field {
      font-size: 14px;
    }
    
    .customer-field strong {
      color: #374151;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .text-right {
      text-align: right;
    }
    
    .part-details {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    /* Price Breakdown */
    .price-breakdown {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .price-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .price-line.total {
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 40px;
    }
    
    .terms-section {
      flex: 1;
    }
    
    .terms-section h3 {
      font-size: 16px;
      color: #374151;
      margin-bottom: 10px;
    }
    
    .terms-section ul {
      list-style: none;
      padding-left: 0;
    }
    
    .terms-section li {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
      padding-left: 16px;
      position: relative;
    }
    
    .terms-section li:before {
      content: "•";
      position: absolute;
      left: 0;
    }
    
    .qr-section {
      text-align: center;
    }
    
    .qr-section img {
      margin-bottom: 10px;
    }
    
    .qr-section p {
      font-size: 12px;
      color: #6b7280;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .status-draft {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-sent {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-accepted {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    
    /* Part Preview */
    .part-preview {
      width: 100%;
      height: 200px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>{{companyInfo.name}}</h1>
        <p>{{companyInfo.address}}</p>
        <p>{{companyInfo.city}}</p>
        <p>Phone: {{companyInfo.phone}}</p>
        <p>Email: {{companyInfo.email}}</p>
      </div>
      {{#if companyInfo.logo}}
        <img src="{{companyInfo.logo}}" alt="Company Logo" class="logo">
      {{/if}}
    </div>
    
    <!-- Quote Header -->
    <div class="quote-header">
      <h2 class="quote-title">Quote #{{quote._id}}</h2>
      <div class="quote-meta">
        <div class="quote-meta-item">
          <label>Date</label>
          <value>{{generatedDate}}</value>
        </div>
        <div class="quote-meta-item">
          <label>Valid Until</label>
          <value>{{validUntil}}</value>
        </div>
        <div class="quote-meta-item">
          <label>Status</label>
          <value><span class="status-badge status-{{quote.status}}">{{quote.status}}</span></value>
        </div>
      </div>
    </div>
    
    <!-- Customer Information -->
    <div class="customer-section">
      <h3 class="section-title">Customer Information</h3>
      <div class="customer-info">
        <div class="customer-field">
          <strong>Name:</strong> {{quote.customer.name}}
        </div>
        <div class="customer-field">
          <strong>Company:</strong> {{quote.customer.company}}
        </div>
        <div class="customer-field">
          <strong>Email:</strong> {{quote.customer.email}}
        </div>
        <div class="customer-field">
          <strong>Phone:</strong> {{quote.customer.phone}}
        </div>
      </div>
    </div>
    
    <!-- Items -->
    <div class="items-section">
      <h3 class="section-title">Quote Items</h3>
      <table>
        <thead>
          <tr>
            <th>Part Name</th>
            <th>Material</th>
            <th>Quantity</th>
            <th>Details</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each quote.items}}
          <tr>
            <td>
              {{this.partName}}
              {{#if this.pricing.details.measurementSource}}
                <div class="part-details">
                  {{#if (eq this.pricing.details.measurementSource "measured")}}
                    ✓ Measured from DXF
                  {{else}}
                    ≈ Estimated
                  {{/if}}
                </div>
              {{/if}}
            </td>
            <td>{{this.material}}</td>
            <td>{{this.quantity}}</td>
            <td>
              <div class="part-details">
                {{#if this.thickness}}Thickness: {{this.thickness}}"{{/if}}<br>
                {{#if this.finishType}}Finish: {{this.finishType}}{{/if}}
              </div>
            </td>
            <td class="text-right">
              {{#if this.pricing.costs.total}}
                ${{divide this.pricing.costs.total this.quantity}}
              {{else}}
                -
              {{/if}}
            </td>
            <td class="text-right">
              {{#if this.pricing.costs.total}}
                ${{this.pricing.costs.total}}
              {{else}}
                -
              {{/if}}
            </td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
    
    <!-- Part Preview Placeholder -->
    <div class="part-preview">
      <span>Part preview will be available in future updates</span>
    </div>
    
    <!-- Price Breakdown -->
    <div class="price-breakdown">
      <h3 class="section-title">Price Breakdown</h3>
      {{#with quote.items.[0].pricing.costs}}
        {{#if ../materialCost}}
        <div class="price-line">
          <span>Material Cost</span>
          <span>${{../materialCost}}</span>
        </div>
        {{/if}}
        {{#if ../cuttingCost}}
        <div class="price-line">
          <span>Cutting Cost</span>
          <span>${{../cuttingCost}}</span>
        </div>
        {{/if}}
        {{#if ../pierceCost}}
        <div class="price-line">
          <span>Pierce Cost</span>
          <span>${{../pierceCost}}</span>
        </div>
        {{/if}}
        {{#if ../bendCost}}
        <div class="price-line">
          <span>Bending Cost</span>
          <span>${{../bendCost}}</span>
        </div>
        {{/if}}
        {{#if ../finishCost}}
        <div class="price-line">
          <span>Finish Cost</span>
          <span>${{../finishCost}}</span>
        </div>
        {{/if}}
        {{#if ../rushFee}}
        <div class="price-line">
          <span>Rush Fee</span>
          <span>${{../rushFee}}</span>
        </div>
        {{/if}}
      {{/with}}
      <div class="price-line total">
        <span>Total Quote</span>
        <span>${{quote.totalPrice}}</span>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <div class="terms-section">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>This quote is valid for 30 days from the date of issue</li>
            <li>Prices are subject to change based on material market conditions</li>
            <li>Lead times are estimated and may vary based on current workload</li>
            <li>Payment terms: Net 30 days from invoice date</li>
            <li>Minimum order value: $100</li>
            <li>All custom parts are non-returnable</li>
            <li>Tolerances as specified or industry standard unless otherwise noted</li>
          </ul>
        </div>
        {{#if qrCodeUrl}}
        <div class="qr-section">
          <img src="{{qrCodeUrl}}" alt="QR Code" width="150" height="150">
          <p>Scan to accept<br>this quote online</p>
        </div>
        {{/if}}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Register Handlebars helpers
handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('divide', (a, b) => {
  const result = parseFloat(a) / parseFloat(b);
  return result.toFixed(2);
});

module.exports = new PDFGenerator();
