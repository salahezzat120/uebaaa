# SendGrid Dynamic Template Setup

## ✅ Template Configuration Complete!

Your email service has been updated to use SendGrid's Dynamic Template API with your template:

- **Template Name:** `grad`
- **Template ID:** `d-aece7743c9914ff0bc80d8eb231831f4`

## Required Environment Variables

Add these to your `backend-node/.env` file:

```env
# SendGrid API Configuration (REQUIRED for dynamic templates)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_TEMPLATE_ID=d-aece7743c9914ff0bc80d8eb231831f4
SENDGRID_FROM_EMAIL=your-verified-email@example.com

# SOC Team Email Addresses
SOC_EMAILS=sklans120@gmail.com
```

## How to Get Your SendGrid API Key

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Guardian Owl UEBA`
5. Choose **Full Access** (or "Mail Send" permissions)
6. Click **Create & View**
7. **COPY THE API KEY** (starts with `SG.`)

## Template Data Structure

The email service automatically sends the following data to your SendGrid template:

```json
{
  "alertId": "alert-123",
  "alertTitle": "Suspicious Activity Detected",
  "alertDescription": "Description of the alert",
  "severity": "HIGH",
  "severityColor": "#ea580c",
  "severityEmoji": "🟠",
  "priority": "2 (High)",
  "status": "Open",
  "anomalyScore": 85,
  "timestamp": "Dec 21, 2025, 5:14:00 PM CST",
  "userEmail": "user@example.com",
  "sourceIP": "192.168.1.100",
  "action": "LOGON",
  "resource": "/api/sensitive-data",
  "model": "LSTM Autoencoder",
  "dashboardUrl": "http://localhost:5173/alerts/alert-123"
}
```

## Using Template Variables in SendGrid

In your SendGrid template editor, use these variables:

- `{{alertId}}` - Alert ID
- `{{alertTitle}}` - Alert title
- `{{alertDescription}}` - Alert description
- `{{severity}}` - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
- `{{severityColor}}` - Color code for severity
- `{{severityEmoji}}` - Emoji for severity
- `{{priority}}` - Priority level
- `{{status}}` - Alert status
- `{{anomalyScore}}` - Anomaly score
- `{{timestamp}}` - Formatted timestamp
- `{{userEmail}}` - User email address
- `{{sourceIP}}` - Source IP address
- `{{action}}` - Action type
- `{{resource}}` - Resource accessed
- `{{model}}` - Detection model name
- `{{dashboardUrl}}` - Link to dashboard

## Example Template Usage

In your SendGrid template, you can use:

```html
<h1>{{severityEmoji}} {{severity}} Alert: {{alertTitle}}</h1>
<p><strong>Alert ID:</strong> {{alertId}}</p>
<p><strong>Description:</strong> {{alertDescription}}</p>
<p><strong>User:</strong> {{userEmail}}</p>
<p><strong>Source IP:</strong> {{sourceIP}}</p>
<p><strong>Anomaly Score:</strong> {{anomalyScore}}/100</p>
<a href="{{dashboardUrl}}">View Alert in Dashboard</a>
```

## Testing

1. Make sure your `.env` file has `SENDGRID_API_KEY` set
2. Test the email service:
   ```bash
   cd backend-node
   node test-email.js
   ```

## Fallback to SMTP

If `SENDGRID_API_KEY` is not set, the service will automatically fall back to SMTP using your existing SMTP configuration.

## Benefits of Dynamic Templates

✅ **Professional Design** - Manage email design in SendGrid dashboard  
✅ **Easy Updates** - Update template without code changes  
✅ **Better Deliverability** - SendGrid handles email delivery  
✅ **Analytics** - Track email opens, clicks, etc. in SendGrid dashboard  
✅ **Unsubscribe Support** - Built-in unsubscribe module support  

---

**Note:** Make sure your `SENDGRID_FROM_EMAIL` is verified in SendGrid's **Settings** → **Sender Authentication**.

