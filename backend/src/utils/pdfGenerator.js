// backend/src/utils/pdfGenerator.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

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
      // Generate QR code placeholder (will implement when qrcode package is installed)
      const qrCodeUrl = null; // await this.generateQRCode(quote._id);
      
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
        }
      };

      // Generate HTML from template
      const html = this.generateHTML(templateData);

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
      // Will implement when qrcode package is installed
      // const QRCode = require('qrcode');
      // const url = `${this.baseUrl}/quotes/${quoteId}/accept`;
      // const qrCodeDataUrl = await QRCode.toDataURL(url, {
      //   width: 150,
      //   margin: 2,
      //   color: {
      //     dark: '#000000',
      //     light: '#FFFFFF'
      //   }
      // });
      // return qrCodeDataUrl;
      return null;
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
   * Generate 2D part preview
   */
  generatePartPreview(dxfData) {
    if (!dxfData || !dxfData.boundingBox) return '';

    const { width, height } = dxfData.boundingBox;
    const scale = Math.min(200 / width, 200 / height);
    const svgWidth = width * scale;
    const svgHeight = height * scale;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw outline (simplified rectangle for now)
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#333" stroke-width="2"/>`;
    
    // Draw holes if any
    if (dxfData.holes && dxfData.holes.length > 0) {
      dxfData.holes.forEach(hole => {
        svg += `<circle cx="${hole.x}" cy="${hole.y}" r="${hole.diameter / 2}" fill="none" stroke="#ff4444" stroke-width="1.5"/>`;
      });
    }
    
    // Draw bend lines if any
    if (dxfData.bendLines && dxfData.bendLines.length > 0) {
      dxfData.bendLines.forEach(bend => {
        svg += `<line x1="${bend.startPoint.x}" y1="${bend.startPoint.y}" x2="${bend.endPoint.x}" y2="${bend.endPoint.y}" stroke="#4444ff" stroke-width="1" stroke-dasharray="5,5"/>`;
      });
    }
    
    svg += '</svg>';
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Generate HTML from template data
   */
  generateHTML(data) {
    const { quote, qrCodeUrl, generatedDate, validUntil, companyInfo } = data;
    
    // Generate items rows with proper calculations
    const itemsRows = (quote.items || []).map(item => {
      const unitPrice = item.pricing?.costs?.total && item.quantity ? 
        (item.pricing.costs.total / item.quantity).toFixed(2) : '0.00';
      const totalPrice = item.pricing?.costs?.total ? 
        item.pricing.costs.total.toFixed(2) : '0.00';
      
      // Generate part preview if DXF data is available
      const partPreview = item.dxfData ? this.generatePartPreview(item.dxfData) : null;
      
      return `
        <tr>
          <td>
            <div class="part-info">
              <strong>${item.partName || 'Part'}</strong>
              ${item.pricing?.details?.measurementSource ? `
                <div class="measurement-type ${item.pricing.details.measurementSource}">
                  ${item.pricing.details.measurementSource === 'measured' ? 
                    '✓ Measured from DXF' : '≈ Estimated'}
                </div>
              ` : ''}
              ${partPreview ? `
                <div class="part-preview-small">
                  <img src="${partPreview}" alt="Part preview" />
                </div>
              ` : ''}
            </div>
          </td>
          <td>${item.material || ''}</td>
          <td class="text-center">${item.quantity || 1}</td>
          <td>
            <div class="part-details">
              ${item.thickness ? `<div>Thickness: ${item.thickness}"</div>` : ''}
              ${item.finishType && item.finishType !== 'none' ? `<div>Finish: ${item.finishType}</div>` : ''}
              ${item.bendComplexity && item.bendComplexity !== 'simple' ? `<div>Bends: ${item.bendComplexity}</div>` : ''}
              ${item.dxfData?.area ? `<div>Area: ${item.dxfData.area.toFixed(2)} sq in</div>` : ''}
            </div>
          </td>
          <td class="text-right">$${unitPrice}</td>
          <td class="text-right">$${totalPrice}</td>
        </tr>
      `;
    }).join('');

    // Calculate totals and breakdown
    const subtotal = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.total || 0), 0);
    const materialCost = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.materialCost || 0), 0);
    const cuttingCost = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.cuttingCost || 0), 0);
    const bendCost = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.bendCost || 0), 0);
    const finishCost = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.finishCost || 0), 0);
    const setupFees = quote.items.reduce((sum, item) => sum + (item.pricing?.costs?.setupFee || 0), 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

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
      background: white;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    
    .company-info h1 {
      color: #667eea;
      font-size: 28px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .quote-title {
      font-size: 32px;
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    .quote-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    .quote-meta-item label {
      display: block;
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .quote-meta-item value {
      display: block;
      font-size: 18px;
      font-weight: 600;
    }
    
    /* Customer Info */
    .customer-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 20px;
      color: #374151;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .customer-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .customer-field {
      font-size: 14px;
    }
    
    .customer-field strong {
      color: #374151;
      font-weight: 600;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    th {
      background: #667eea;
      color: white;
      padding: 15px 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 15px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .part-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .part-details {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }
    
    .part-details div {
      margin: 2px 0;
    }
    
    .measurement-type {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    
    .measurement-type.measured {
      background: #d1fae5;
      color: #065f46;
    }
    
    .measurement-type.estimated {
      background: #fed7aa;
      color: #92400e;
    }
    
    .part-preview-small {
      margin-top: 8px;
      padding: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      text-align: center;
    }
    
    .part-preview-small img {
      max-width: 80px;
      max-height: 80px;
    }
    
    /* Price Breakdown */
    .price-breakdown {
      background: #f3f4f6;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .price-breakdown h3 {
      margin-bottom: 15px;
      color: #374151;
    }
    
    .price-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .price-line.subtotal {
      font-weight: 600;
      color: #374151;
      font-size: 16px;
      border-top: 1px solid #e5e7eb;
      margin-top: 8px;
      padding-top: 12px;
    }
    
    .price-line.total {
      border-top: 2px solid #667eea;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #dbeafe;
      color: #1e40af;
    }
    
    /* Terms and QR Section */
    .footer-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    
    .terms-section h4 {
      font-size: 16px;
      color: #374151;
      margin-bottom: 12px;
    }
    
    .terms-list {
      list-style: none;
      padding: 0;
    }
    
    .terms-list li {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    
    .terms-list li:before {
      content: "•";
      position: absolute;
      left: 8px;
      color: #667eea;
    }
    
    .qr-section {
      text-align: center;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .qr-section img {
      margin-bottom: 10px;
      max-width: 150px;
    }
    
    .qr-section p {
      font-size: 12px;
      color: #6b7280;
    }
    
    /* Notes Section */
    .notes-section {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .notes-section h4 {
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .notes-section p {
      color: #78350f;
      font-size: 14px;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>${companyInfo.name}</h1>
        <p>${companyInfo.address}</p>
        <p>${companyInfo.city}</p>
        <p>Phone: ${companyInfo.phone}</p>
        <p>Email: ${companyInfo.email}</p>
        <p>Web: ${companyInfo.website}</p>
      </div>
      ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" class="logo">` : ''}
    </div>
    
    <!-- Quote Header -->
    <div class="quote-header">
      <h2 class="quote-title">Manufacturing Quote</h2>
      <div class="quote-meta">
        <div class="quote-meta-item">
          <label>Quote Number</label>
          <value>#${quote._id.slice(-8).toUpperCase()}</value>
        </div>
        <div class="quote-meta-item">
          <label>Issue Date</label>
          <value>${generatedDate}</value>
        </div>
        <div class="quote-meta-item">
          <label>Valid Until</label>
          <value>${validUntil}</value>
        </div>
      </div>
    </div>
    
    <!-- Customer Information -->
    ${quote.customer ? `
    <div class="customer-section">
      <h3 class="section-title">Customer Information</h3>
      <div class="customer-info-grid">
        <div class="customer-field">
          <strong>Name:</strong> ${quote.customer.name || ''}
        </div>
        <div class="customer-field">
          <strong>Company:</strong> ${quote.customer.company || ''}
        </div>
        <div class="customer-field">
          <strong>Email:</strong> ${quote.customer.email || ''}
        </div>
        <div class="customer-field">
          <strong>Phone:</strong> ${quote.customer.phone || ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Notes if any -->
    ${quote.notes ? `
    <div class="notes-section">
      <h4>Special Instructions</h4>
      <p>${quote.notes}</p>
    </div>
    ` : ''}
    
    <!-- Items -->
    <div class="items-section">
      <h3 class="section-title">Quote Details</h3>
      <table>
        <thead>
          <tr>
            <th>Part Description</th>
            <th>Material</th>
            <th class="text-center">Qty</th>
            <th>Specifications</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>
    
    <!-- Price Breakdown -->
    <div class="price-breakdown">
      <h3>Price Breakdown</h3>
      ${materialCost > 0 ? `
      <div class="price-line">
        <span>Material Cost</span>
        <span>$${materialCost.toFixed(2)}</span>
      </div>
      ` : ''}
      ${cuttingCost > 0 ? `
      <div class="price-line">
        <span>Cutting Cost</span>
        <span>$${cuttingCost.toFixed(2)}</span>
      </div>
      ` : ''}
      ${bendCost > 0 ? `
      <div class="price-line">
        <span>Bending Cost</span>
        <span>$${bendCost.toFixed(2)}</span>
      </div>
      ` : ''}
      ${finishCost > 0 ? `
      <div class="price-line">
        <span>Finishing Cost</span>
        <span>$${finishCost.toFixed(2)}</span>
      </div>
      ` : ''}
      ${setupFees > 0 ? `
      <div class="price-line">
        <span>Setup Fees</span>
        <span>$${setupFees.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="price-line subtotal">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div class="price-line">
        <span>Tax (8%)</span>
        <span>$${tax.toFixed(2)}</span>
      </div>
      <div class="price-line total">
        <span>Total Amount</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    </div>
    
    <!-- Terms and QR Code -->
    <div class="footer-section">
      <div class="terms-section">
        <h4>Terms & Conditions</h4>
        <ul class="terms-list">
          <li>This quote is valid for 30 days from the issue date</li>
          <li>50% deposit required to begin production</li>
          <li>Lead time: 5-7 business days after approval</li>
          <li>Prices subject to material market fluctuations</li>
          <li>Shipping costs not included unless specified</li>
          <li>All parts manufactured to industry standard tolerances</li>
        </ul>
      </div>
      ${qrCodeUrl ? `
      <div class="qr-section">
        <img src="${qrCodeUrl}" alt="QR Code" />
        <p>Scan to accept quote online</p>
      </div>
      ` : `
      <div class="qr-section">
        <p><strong>To accept this quote:</strong></p>
        <p>Email: ${companyInfo.email}</p>
        <p>Phone: ${companyInfo.phone}</p>
        <p>Reference Quote #${quote._id.slice(-8).toUpperCase()}</p>
      </div>
      `}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Thank you for the opportunity to quote on your project!</p>
      <p>${companyInfo.name} • ${companyInfo.address}, ${companyInfo.city}</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new PDFGenerator();
