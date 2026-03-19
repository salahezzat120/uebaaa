import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_TEMPLATE_ID = process.env.SENDGRID_TEMPLATE_ID || 'd-aece7743c9914ff0bc80d8eb231831f4';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@guardianowl.com';

// SOC team email addresses (comma-separated)
const SOC_EMAILS = (process.env.SOC_EMAILS || 'soc@company.com').split(',').map(email => email.trim());

// Initialize SendGrid if API key is provided
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('[Email Service] SMTP credentials not configured. Email notifications disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
}

/**
 * Send alert notification email to SOC team using SendGrid Dynamic Template
 * @param {Object} alert - Alert object
 * @param {string} alert.id - Alert ID
 * @param {string} alert.title - Alert title
 * @param {string} alert.description - Alert description
 * @param {string} alert.severity - Alert severity (critical, high, medium, low)
 * @param {string} alert.status - Alert status
 * @param {Object} alert.metadata - Alert metadata
 * @param {number} alert.anomaly_score - Anomaly score
 * @param {string} alert.created_at - Alert creation timestamp
 */
export async function sendAlertEmail(alert) {
  try {
    // Use SendGrid if API key is configured
    if (SENDGRID_API_KEY) {
      return await sendAlertEmailViaSendGrid(alert);
    }

    // Fall back to SMTP
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[Email Service] Email transporter not available. Skipping email notification.');
      return { success: false, error: 'Email not configured' };
    }

    return await sendAlertEmailViaSMTP(alert, transporter);
  } catch (error) {
    console.error('[Email Service] ❌ Error sending alert email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send alert email via SendGrid Dynamic Template
 */
async function sendAlertEmailViaSendGrid(alert) {
  // Determine severity color and priority
  const severityConfig = {
    critical: { color: '#dc2626', priority: '1 (Highest)', emoji: '🔴' },
    high: { color: '#ea580c', priority: '2 (High)', emoji: '🟠' },
    medium: { color: '#f59e0b', priority: '3 (Medium)', emoji: '🟡' },
    low: { color: '#3b82f6', priority: '4 (Low)', emoji: '🔵' },
  };

  const severity = alert.severity || 'medium';
  const config = severityConfig[severity] || severityConfig.medium;

  // Format timestamp
  const timestamp = new Date(alert.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
  });

  // Extract user information
  const userEmail = alert.metadata?.user_email || alert.metadata?.user || 'Unknown';
  const sourceIP = alert.metadata?.source_ip || 'Unknown';
  const action = alert.metadata?.action || 'Unknown';
  const resource = alert.metadata?.resource || 'N/A';
  const model = alert.metadata?.model || 'Unknown';

  // Prepare dynamic template data
  const templateData = {
    alertId: alert.id,
    alertTitle: alert.title,
    alertDescription: alert.description || 'No description available',
    severity: severity.toUpperCase(),
    severityColor: config.color,
    severityEmoji: config.emoji,
    priority: config.priority,
    status: alert.status || 'Open',
    anomalyScore: alert.anomaly_score || 'N/A',
    timestamp: timestamp,
    userEmail: userEmail,
    sourceIP: sourceIP,
    action: action,
    resource: resource,
    model: model,
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts/${alert.id}`,
  };

  // Send to all SOC team members
  const messages = SOC_EMAILS.map(to => ({
    to,
    from: SENDGRID_FROM_EMAIL,
    templateId: SENDGRID_TEMPLATE_ID,
    dynamicTemplateData: templateData,
    subject: `[${severity.toUpperCase()}] ${alert.title} - Alert ID: ${alert.id}`,
  }));

  await sgMail.send(messages);
  console.log(`[Email Service] ✅ Alert email sent via SendGrid to SOC team (${SOC_EMAILS.length} recipient(s))`);
  
  return { success: true, method: 'sendgrid' };
}

/**
 * Send alert email via SMTP (fallback)
 */
async function sendAlertEmailViaSMTP(alert, transporter) {
  // Determine severity color and priority
  const severityConfig = {
    critical: { color: '#dc2626', priority: '1 (Highest)', emoji: '🔴' },
    high: { color: '#ea580c', priority: '2 (High)', emoji: '🟠' },
    medium: { color: '#f59e0b', priority: '3 (Medium)', emoji: '🟡' },
    low: { color: '#3b82f6', priority: '4 (Low)', emoji: '🔵' },
  };

  const severity = alert.severity || 'medium';
  const config = severityConfig[severity] || severityConfig.medium;

  // Format timestamp
  const timestamp = new Date(alert.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
  });

  // Extract user information
  const userEmail = alert.metadata?.user_email || alert.metadata?.user || 'Unknown';
  const sourceIP = alert.metadata?.source_ip || 'Unknown';
  const action = alert.metadata?.action || 'Unknown';
  const resource = alert.metadata?.resource || 'N/A';
  const model = alert.metadata?.model || 'Unknown';

    // Create HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${config.color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .alert-box { background: white; border-left: 4px solid ${config.color}; padding: 15px; margin: 15px 0; }
    .severity-badge { display: inline-block; padding: 5px 10px; background: ${config.color}; color: white; border-radius: 3px; font-weight: bold; }
    .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .details-table td { padding: 8px; border-bottom: 1px solid #eee; }
    .details-table td:first-child { font-weight: bold; width: 150px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 10px 20px; background: ${config.color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.emoji} Security Alert: ${severity.toUpperCase()}</h1>
      <p style="margin: 0;">Priority: ${config.priority}</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">${alert.title}</h2>
        <p><strong>Severity:</strong> <span class="severity-badge">${severity.toUpperCase()}</span></p>
        <p><strong>Status:</strong> ${alert.status || 'Open'}</p>
        <p><strong>Anomaly Score:</strong> ${alert.anomaly_score || 'N/A'}/100</p>
      </div>

      <h3>Alert Details</h3>
      <table class="details-table">
        <tr>
          <td>Alert ID:</td>
          <td>${alert.id}</td>
        </tr>
        <tr>
          <td>Description:</td>
          <td>${alert.description || 'No description available'}</td>
        </tr>
        <tr>
          <td>Timestamp:</td>
          <td>${timestamp}</td>
        </tr>
        <tr>
          <td>User:</td>
          <td>${userEmail}</td>
        </tr>
        <tr>
          <td>Source IP:</td>
          <td>${sourceIP}</td>
        </tr>
        <tr>
          <td>Action:</td>
          <td>${action}</td>
        </tr>
        <tr>
          <td>Resource:</td>
          <td>${resource}</td>
        </tr>
        <tr>
          <td>Detection Model:</td>
          <td>${model}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts/${alert.id}" class="button">
          View Alert in Dashboard
        </a>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated alert from Guardian Owl UEBA System</p>
      <p>Please investigate this alert promptly based on its severity level.</p>
    </div>

    <div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
      <p style="font-size:12px; line-height:20px;">
        <a class="Unsubscribe--unsubscribeLink" href="{{{unsubscribe}}}" target="_blank" style="font-family:sans-serif;text-decoration:none;">
          Unsubscribe
        </a>
        -
        <a href="{{{unsubscribe_preferences}}}" target="_blank" class="Unsubscribe--unsubscribePreferences" style="font-family:sans-serif;text-decoration:none;">
          Unsubscribe Preferences
        </a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Create plain text version
    const textContent = `
SECURITY ALERT: ${severity.toUpperCase()}

${alert.title}

Severity: ${severity.toUpperCase()}
Status: ${alert.status || 'Open'}
Anomaly Score: ${alert.anomaly_score || 'N/A'}/100
Priority: ${config.priority}

Description:
${alert.description || 'No description available'}

Details:
- Alert ID: ${alert.id}
- Timestamp: ${timestamp}
- User: ${userEmail}
- Source IP: ${sourceIP}
- Action: ${action}
- Resource: ${resource}
- Detection Model: ${model}

View in Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts/${alert.id}

This is an automated alert from Guardian Owl UEBA System.
Please investigate this alert promptly based on its severity level.
    `;

    // Send email to all SOC team members
    const mailOptions = {
      from: `"Guardian Owl UEBA" <${emailConfig.auth.user}>`,
      to: SOC_EMAILS.join(', '),
      subject: `[${severity.toUpperCase()}] ${alert.title} - Alert ID: ${alert.id}`,
      text: textContent,
      html: htmlContent,
      priority: severity === 'critical' ? 'high' : 'normal',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ✅ Alert email sent via SMTP to SOC team: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId, method: 'smtp' };
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(testEmail) {
  try {
    const recipient = testEmail || SOC_EMAILS[0];
    
    // Use SendGrid if API key is configured
    if (SENDGRID_API_KEY) {
      const msg = {
        to: recipient,
        from: SENDGRID_FROM_EMAIL,
        subject: 'Guardian Owl UEBA - Test Email',
        text: 'This is a test email from Guardian Owl UEBA system. Email notifications are working correctly!',
        html: '<p>This is a test email from <strong>Guardian Owl UEBA</strong> system.</p><p>Email notifications are working correctly!</p>',
      };
      
      await sgMail.send(msg);
      console.log(`[Email Service] ✅ Test email sent via SendGrid to: ${recipient}`);
      return { success: true, method: 'sendgrid' };
    }

    // Fall back to SMTP
    const transporter = getTransporter();
    if (!transporter) {
      return { success: false, error: 'Email not configured' };
    }

    const mailOptions = {
      from: `"Guardian Owl UEBA" <${emailConfig.auth.user}>`,
      to: recipient,
      subject: 'Guardian Owl UEBA - Test Email',
      text: 'This is a test email from Guardian Owl UEBA system. Email notifications are working correctly!',
      html: '<p>This is a test email from <strong>Guardian Owl UEBA</strong> system.</p><p>Email notifications are working correctly!</p>',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ✅ Test email sent via SMTP to: ${recipient}`);
    return { success: true, messageId: info.messageId, method: 'smtp' };
  } catch (error) {
    console.error('[Email Service] Error sending test email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured() {
  // Check for SendGrid API key first (preferred)
  if (SENDGRID_API_KEY) {
    return true;
  }
  // Fall back to SMTP configuration
  return !!(emailConfig.auth.user && emailConfig.auth.pass);
}

