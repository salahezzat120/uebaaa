/**
 * Quick script to verify .env file contents
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(60));
console.log('🔍 .env File Verification');
console.log('='.repeat(60));
console.log('');

const envPath = join(__dirname, '.env');
console.log('Looking for .env at:', envPath);
console.log('File exists:', existsSync(envPath));
console.log('');

if (existsSync(envPath)) {
  console.log('📄 .env file contents:');
  console.log('-'.repeat(60));
  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  // Show lines related to email
  lines.forEach((line, index) => {
    if (line.includes('SMTP') || line.includes('SOC_EMAILS') || line.trim().startsWith('#')) {
      console.log(`${index + 1}: ${line}`);
    }
  });
  console.log('-'.repeat(60));
  console.log('');
}

// Load environment variables
dotenv.config({ path: envPath });

console.log('📋 Environment Variables:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || '❌ NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  SOC_EMAILS:', process.env.SOC_EMAILS || '❌ NOT SET');
console.log('');

if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  console.log('✅ Email configuration found!');
} else {
  console.log('❌ Email configuration missing!');
  console.log('');
  console.log('Add these lines to backend-node/.env:');
  console.log('');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_SECURE=false');
  console.log('SMTP_USER=sklans120@gmail.com');
  console.log('SMTP_PASSWORD=dincvxngaqrlhzgm');
  console.log('SOC_EMAILS=sklans120@gmail.com');
}

console.log('');
console.log('='.repeat(60));

