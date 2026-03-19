/**
 * Check what password is actually in .env
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

console.log('='.repeat(60));
console.log('🔍 Checking .env Password');
console.log('='.repeat(60));
console.log('');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  console.log('Password line in .env:');
  lines.forEach((line, index) => {
    if (line.includes('SMTP_PASSWORD=')) {
      console.log(`Line ${index + 1}: ${line}`);
      const password = line.split('=')[1]?.trim();
      console.log(`  Extracted password: "${password}"`);
      console.log(`  Length: ${password?.length} characters`);
      console.log(`  Has spaces: ${password?.includes(' ') ? 'YES ❌' : 'NO ✅'}`);
      console.log(`  Expected: huxwkrhyskkzrdlfk`);
      console.log(`  Matches: ${password === 'huxwkrhyskkzrdlfk' ? 'YES ✅' : 'NO ❌'}`);
    }
  });
  console.log('');
}

// Load environment
dotenv.config({ path: envPath });

console.log('Environment variable after loading:');
console.log(`  SMTP_PASSWORD: "${process.env.SMTP_PASSWORD}"`);
console.log(`  Length: ${process.env.SMTP_PASSWORD?.length} characters`);
console.log(`  Has spaces: ${process.env.SMTP_PASSWORD?.includes(' ') ? 'YES ❌' : 'NO ✅'}`);
console.log('');

console.log('='.repeat(60));

