# Email Configuration Instructions

## Setting Up Email for Smart Quote Generator

To enable email functionality, you need to configure SMTP settings in the backend `.env` file.

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Scroll down and click on "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update `.env` file** in the backend folder:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   COMPANY_NAME=Your Company Name
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up** for SendGrid at https://sendgrid.com
2. **Create an API Key**:
   - Go to Settings → API Keys
   - Create a new API key with "Full Access"
   - Copy the API key

3. **Update `.env` file**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   COMPANY_NAME=Your Company Name
   ```

### Option 3: Other SMTP Services

You can use any SMTP service (Mailgun, AWS SES, etc.). Just update the `.env` file with the appropriate credentials:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
COMPANY_NAME=Your Company Name
```

### Testing Email

1. Make sure both backend and frontend are running
2. Create a new quote
3. Click "Send Email" button
4. Enter recipient email and send
5. Check the recipient's inbox (and spam folder)

### Troubleshooting

- **"Failed to send email"**: Check your SMTP credentials
- **Emails going to spam**: Add SPF/DKIM records to your domain
- **Connection timeout**: Check firewall settings for SMTP port
- **Invalid credentials**: Make sure you're using app password for Gmail, not regular password

### Security Notes

- Never commit `.env` file to version control
- Use environment variables in production
- Consider using OAuth2 for Gmail in production
- Implement rate limiting to prevent email spam
