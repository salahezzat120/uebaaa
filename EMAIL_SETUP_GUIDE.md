# Email Notification Setup Guide

## Overview

The Guardian Owl UEBA system now sends email notifications to the SOC (Security Operations Center) team when alerts are created. This guide explains how to configure email notifications.

## Features

✅ **Automatic Email Notifications**
- Emails are sent automatically when alerts are created
- Only high and critical severity alerts trigger emails (configurable)
- HTML and plain text email formats
- Includes all alert details and direct link to dashboard

✅ **Email Configuration**
- Supports any SMTP server (Gmail, Outlook, SendGrid, etc.)
- Configurable via environment variables
- Test email endpoint for verification

## Setup Instructions

### 1. Install Dependencies

The email service uses `nodemailer`. Install it:

```bash
cd backend-node
npm install nodemailer
```

### 2. Configure Environment Variables

Add these variables to your `.env` file in the `backend-node` directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SOC Team Email Addresses (comma-separated)
SOC_EMAILS=soc@company.com,security-team@company.com,admin@company.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail Setup (Example)

If using Gmail, you need to:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Guardian Owl UEBA"
   - Copy the generated 16-character password
   - Use this as `SMTP_PASSWORD` (not your regular Gmail password)

3. **Use these settings**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

### 4. Other Email Providers

#### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=your-password
```

### 5. Test Email Configuration

After setting up, test the email service:

**Option 1: Using the API endpoint**
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

**Option 2: Check configuration**
```bash
curl http://localhost:3000/api/email/config
```

### 6. Restart Backend Server

After configuring environment variables, restart your backend server:

```bash
cd backend-node
npm run dev
```

## How It Works

### Automatic Email Sending

Emails are automatically sent when:

1. **New alerts are created** via the API (`POST /api/alerts`)
2. **Alerts are detected** by the Logstash processor
3. **Alert severity is "high" or "critical"** (configurable)

### Email Content

Each email includes:

- **Alert Title and Severity**
- **Alert Description**
- **Anomaly Score**
- **User Information** (email, IP address)
- **Action and Resource Details**
- **Detection Model Information**
- **Direct Link** to view alert in dashboard
- **Timestamp**

### Email Format

- **HTML Email**: Formatted with colors, tables, and styling
- **Plain Text**: Fallback for email clients that don't support HTML
- **Priority**: High priority for critical alerts

## Customization

### Change Severity Threshold

To send emails for all alerts (including medium/low), edit:

**`backend-node/src/services/logstashProcessor.js`** (line ~227):
```javascript
// Send email for all severities
if (severity === 'critical' || severity === 'high' || severity === 'medium') {
  await sendAlertEmail(createdAlertData);
}
```

**`backend-node/src/routes/alerts.js`** (line ~88):
```javascript
// Send email for all severities
if (data.severity === 'critical' || data.severity === 'high' || data.severity === 'medium') {
  await sendAlertEmail(data);
}
```

### Customize Email Template

Edit the HTML template in:
**`backend-node/src/utils/emailService.js`** (function `sendAlertEmail`)

### Add More Recipients

Add more email addresses to `SOC_EMAILS` in `.env`:
```env
SOC_EMAILS=soc@company.com,security@company.com,manager@company.com,oncall@company.com
```

## Troubleshooting

### "Email not configured" Warning

**Problem**: Emails are not being sent, and you see warnings in logs.

**Solution**: 
1. Check that all SMTP environment variables are set
2. Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
3. For Gmail, make sure you're using an App Password, not your regular password

### "Authentication failed" Error

**Problem**: SMTP authentication fails.

**Solution**:
1. Verify username and password are correct
2. For Gmail, ensure 2FA is enabled and you're using an App Password
3. Check if your email provider requires special authentication

### "Connection timeout" Error

**Problem**: Cannot connect to SMTP server.

**Solution**:
1. Verify `SMTP_HOST` and `SMTP_PORT` are correct
2. Check firewall settings
3. Try different ports (587, 465, 25)

### Emails Not Received

**Problem**: No emails are received, but no errors in logs.

**Solution**:
1. Check spam/junk folder
2. Verify recipient email addresses in `SOC_EMAILS`
3. Test with the test email endpoint
4. Check email provider's sending limits

## Security Best Practices

1. **Use App Passwords**: Never use your main email password
2. **Restrict Access**: Only authorized SOC team members should receive alerts
3. **Encrypt Connections**: Use `SMTP_SECURE=true` with port 465 for SSL
4. **Environment Variables**: Never commit `.env` file to version control
5. **Rate Limiting**: Consider implementing rate limiting for email sending

## API Endpoints

### Test Email
```
POST /api/email/test
Body: { "email": "test@example.com" }
```

### Check Configuration
```
GET /api/email/config
Response: { "configured": true/false, "message": "..." }
```

## Example Email

When an alert is created, the SOC team receives an email like:

**Subject**: `[CRITICAL] Anomaly Detected: account_compromise - Alert ID: abc123`

**Body**:
- Red header with "🔴 Security Alert: CRITICAL"
- Alert details in formatted table
- Direct link to view alert in dashboard
- All relevant information (user, IP, action, etc.)

## Support

If you encounter issues:
1. Check backend logs for error messages
2. Test email configuration using the test endpoint
3. Verify all environment variables are set correctly
4. Check your email provider's documentation for SMTP settings

---

**Ready to go!** Once configured, your SOC team will automatically receive email notifications for all high and critical security alerts. 🚀

