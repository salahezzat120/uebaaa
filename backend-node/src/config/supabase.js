import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables');
}

// Client for general operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service operations (uses service role key)
// This is optional but recommended for file uploads
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Validate service role key format (should be JWT token starting with eyJ)
function isValidJWT(key) {
  if (!key || typeof key !== 'string') return false;
  // JWT tokens start with eyJ (base64 encoded header)
  return key.trim().startsWith('eyJ') && key.length > 100;
}

// Log connection status
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configured');
  console.log(`   URL: ${supabaseUrl}`);
  if (supabaseAdmin) {
    if (isValidJWT(supabaseServiceKey)) {
      console.log('   Admin client: Available (service role key set)');
    } else {
      console.log('   ⚠️  Admin client: Service role key format appears invalid');
      console.log('   Expected: JWT token starting with "eyJ" (get from Supabase Dashboard → Settings → API)');
      console.log('   Current key starts with:', supabaseServiceKey?.substring(0, 10) || 'undefined');
    }
  } else {
    console.log('   ⚠️  Admin client: Not available (SUPABASE_SERVICE_ROLE_KEY not set)');
    console.log('   Note: Some operations may require service role key');
  }
}
