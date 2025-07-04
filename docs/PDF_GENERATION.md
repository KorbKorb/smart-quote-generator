# PDF Quote Generation Documentation

## Overview
The Smart Quote Generator now includes professional PDF generation with company branding, QR codes, and email delivery capabilities.

## Features Implemented

### 1. **PDF Generation Service** (`backend/src/utils/pdfGenerator.js`)
- Uses Puppeteer for high-quality PDF rendering
- Generates QR codes for online quote acceptance
- Includes company branding and logo
- Professional layout with:
  - Company header with contact info
  - Quote summary with validity period
  - Customer information section
  - Detailed items table with specifications
  - Price breakdown with all cost components
  - Terms & conditions
  - QR code for digital acceptance

### 2. **Email Service** (`backend/src/utils/emailService.js`)
- Send quotes via email with PDF attachment
- Professional HTML email template
- Follow-up reminder capabilities
- SMTP configuration support

### 3. **API Endpoints**
- `GET /api/quotes/:id/pdf` - Download PDF directly
- `POST /api/quotes/:id/generate-pdf` - Generate and save PDF
- `POST /api/quotes/:id/send-email` - Send quote via email

### 4. **Frontend Integration**
- Download PDF button in QuoteDisplay component
- Loading state during PDF generation
- Error handling for failed generations

## Installation

### Backend Dependencies
```bash
cd backend
npm install puppeteer qrcode handlebars nodemailer
```

### Environment Variables
Add to your `.env` file:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Company Information
COMPANY_NAME=Smart Manufacturing Co.
FRONTEND_URL=http://localhost:3000
```

## Usage

### 1. Download PDF from Frontend
```javascript
// Click "Download PDF" button in QuoteDisplay
// PDF generates and downloads automatically
```

### 2. Send Quote via Email
```javascript
// POST /api/quotes/:id/send-email
{
  "recipientEmail": "customer@email.com" // Optional, uses quote customer email by default
}
```

### 3. Generate PDF Programmatically
```javascript
const pdfGenerator = require('./utils/pdfGenerator');
const { filename, filepath, buffer } = await pdfGenerator.generateQuotePDF(quote);
```

## PDF Layout

### Header Section
- Company logo (200x60px)
- Company name and contact information
- Professional gradient design

### Quote Information
- Quote ID and status
- Creation date and validity period
- Customer details

### Items Table
- Part name with DXF indicator
- Material and quantity
- Thickness and finish details
- Unit and total pricing

### Price Breakdown
- Material cost
- Cutting cost
- Pierce cost (if holes present)
- Bending cost (if bends present)
- Finish cost
- Rush fee (if applicable)
- **Total quote amount**

### Footer
- Terms & conditions (7 items)
- QR code for online acceptance
- Company contact information

## Customization

### 1. Update Company Information
Edit in `pdfGenerator.js`:
```javascript
companyInfo: {
  name: 'Your Company Name',
  address: 'Your Address',
  city: 'Your City, State ZIP',
  phone: 'Your Phone',
  email: 'your-email@company.com',
  website: 'www.yourcompany.com'
}
```

### 2. Modify Terms & Conditions
Edit the terms list in the HTML template:
```html
<li>Your custom term here</li>
```

### 3. Change Logo
1. Place your logo in `backend/public/images/logo.svg` or `.png`
2. Update the `getBase64Logo()` method to read your file

### 4. Customize Email Template
Edit `emailService.js` to modify the email design and content

## Testing

### 1. Test PDF Generation
```bash
# Create a test quote first
# Navigate to the quote in the UI
# Click "Download PDF"
# Verify PDF opens correctly
```

### 2. Test Email Sending
```bash
# Use a test email service like Ethereal
# Or configure real SMTP credentials
# Send test quote via API or UI
```

### 3. Verify PDF Contents
- Company branding appears correctly
- All quote data is accurate
- QR code is scannable
- Layout is professional

## Troubleshooting

### Common Issues

1. **Puppeteer Installation Failed**
   ```bash
   # Try manual Chromium download
   npm install puppeteer --unsafe-perm=true --allow-root
   ```

2. **PDF Generation Timeout**
   - Increase timeout in Puppeteer launch options
   - Check for infinite loops in template

3. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall/port access
   - Enable "Less secure app access" for Gmail

4. **QR Code Not Generating**
   - Verify FRONTEND_URL is set correctly
   - Check quote ID is valid

### Performance Tips

1. **Cache Generated PDFs**
   - Store PDFs for repeated downloads
   - Implement cleanup for old PDFs

2. **Async Generation**
   - For large quotes, generate in background
   - Send email notification when ready

3. **Template Optimization**
   - Minimize CSS in template
   - Optimize images as base64

## Future Enhancements

1. **Part Preview from DXF**
   - Convert DXF to SVG for inline preview
   - Show actual part geometry in PDF

2. **Multi-language Support**
   - Translate PDF content
   - RTL language support

3. **Custom Templates**
   - Multiple template designs
   - Industry-specific layouts

4. **Digital Signatures**
   - Add signature fields
   - DocuSign integration

5. **Advanced Analytics**
   - Track PDF downloads
   - Monitor email open rates
   - Quote acceptance tracking

The PDF generation system provides professional, branded quotes that can be easily shared and accepted by customers!
