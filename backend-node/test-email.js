/**
 * Test Email Script
 * Run this to test email configuration
 * Usage: node test-email.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend-node directory FIRST, before importing emailService
dotenv.config({ path: join(__dirname, '.env') });

// Now import emailService after environment variables are loaded
import { sendTestEmail, sendAlertEmail, isEmailConfigured } from './src/utils/emailService.js';

const testEmail = 'sklans120@gmail.com';

console.log('='.repeat(60));
console.log('📧 Guardian Owl UEBA - Email Test Script');
console.log('='.repeat(60));
console.log('');

// Check configuration
console.log('1️⃣ Checking email configuration...');
console.log('');
console.log('Debug - Environment variables:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('');

const configured = isEmailConfigured();

if (!configured) {
  console.log('❌ Email service is NOT configured!');
  console.log('');
  console.log('Please set these environment variables in .env:');
  console.log('  - SMTP_HOST=smtp.gmail.com');
  console.log('  - SMTP_PORT=587');
  console.log('  - SMTP_SECURE=false');
  console.log('  - SMTP_USER=sklans120@gmail.com');
  console.log('  - SMTP_PASSWORD=dincvxngaqrlhzgm');
  console.log('  - SOC_EMAILS=sklans120@gmail.com');
  console.log('');
  console.log('Make sure .env file exists in backend-node/ directory!');
  console.log('See GMAIL_FREE_SETUP.md for instructions!');
  process.exit(1);
}

console.log('✅ Email service is configured');
console.log('');

// Test 1: Send test email
console.log('2️⃣ Sending test email...');
console.log(`   Recipient: ${testEmail}`);
const testResult = await sendTestEmail(testEmail);

if (testResult.success) {
  console.log('✅ Test email sent successfully!');
  console.log(`   Message ID: ${testResult.messageId}`);
} else {
  console.log('❌ Failed to send test email');
  console.log(`   Error: ${testResult.error}`);
  process.exit(1);
}

console.log('');
console.log('3️⃣ Sending sample alert email...');

// Test 2: Send sample alert email
const sampleAlert = {
  id: 'TEST-ALERT-001',
  title: 'Test Alert: Account Compromise Detected',
  description: 'This is a test alert to verify email notifications are working correctly. Multiple failed login attempts detected from anomalous IP address.',
  severity: 'critical',
  status: 'open',
  anomaly_score: 95,
  created_at: new Date().toISOString(),
  metadata: {
    user_email: 'test.user@company.com',
    source_ip: '192.168.1.100',
    action: 'login',
    resource: '/api/login',
    model: 'LSTM Autoencoder',
  },
};

const alertResult = await sendAlertEmail(sampleAlert);

if (alertResult.success) {
  console.log('✅ Sample alert email sent successfully!');
  console.log(`   Message ID: ${alertResult.messageId}`);
} else {
  console.log('❌ Failed to send alert email');
  console.log(`   Error: ${alertResult.error}`);
}

console.log('');
console.log('='.repeat(60));
console.log('✨ Test complete!');
console.log('');
console.log('📬 Check your email inbox:');
console.log(`   ${testEmail}`);
console.log('   (Also check spam/junk folder if not found)');
console.log('='.repeat(60));
