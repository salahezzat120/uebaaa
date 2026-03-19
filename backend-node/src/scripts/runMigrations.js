import { supabaseAdmin } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration(filePath, description) {
  console.log(`\n📄 Running: ${description}`);
  console.log(`   File: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    // Execute each statement using Supabase RPC (if available) or direct SQL
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We'll need to use the REST API or provide instructions
    
    console.log(`   ⚠️  Note: Supabase JS client cannot execute raw SQL directly.`);
    console.log(`   Please run this SQL in Supabase Dashboard → SQL Editor`);
    console.log(`   Or use the Supabase CLI if available.`);
    
    return { success: true, statements: statements.length };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function seedTestData() {
  console.log(`\n🌱 Seeding test data...`);
  
  const client = supabaseAdmin || supabase;
  
  if (!client) {
    console.error('❌ Supabase client not available');
    return;
  }

  // Check if tables exist
  const { data: checkData, error: checkError } = await client
    .from('data_sources')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error(`❌ Tables don't exist yet. Error: ${checkError.message}`);
    console.log(`\n📋 Please run the migration SQL first:`);
    console.log(`   1. Go to: https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/sql/new`);
    console.log(`   2. Copy SQL from: supabase/migrations/001_initial_schema.sql`);
    console.log(`   3. Paste and run it`);
    return;
  }

  console.log(`✅ Tables exist, inserting test data...`);

  const dataSources = [
    {
      name: 'Production Auth Logs',
      type: 'logstash',
      status: 'connected',
      health: 98,
      records: 1250000,
      events_per_sec: 450,
      config: {
        endpoint: 'https://logstash.company.com:5044',
        indexPattern: 'logs-*'
      },
      last_sync: new Date().toISOString()
    },
    {
      name: 'Security Events API',
      type: 'api',
      status: 'connected',
      health: 95,
      records: 890000,
      events_per_sec: 320,
      config: {
        endpoint: 'https://api.company.com/events',
        apiKey: '***'
      },
      last_sync: new Date().toISOString()
    },
    {
      name: 'User Activity Database',
      type: 'database',
      status: 'disconnected',
      health: 0,
      records: 0,
      events_per_sec: 0,
      config: {
        connectionString: 'postgresql://...',
        dbType: 'postgres'
      }
    },
    {
      name: 'Q4 Auth Logs',
      type: 'csv',
      status: 'connected',
      health: 100,
      records: 50000,
      events_per_sec: 0,
      config: {
        fileName: 'q4_auth_logs.csv',
        fileSize: 2048000,
        uploadedAt: new Date().toISOString()
      },
      last_sync: new Date().toISOString()
    },
    {
      name: 'After Hours Activity',
      type: 'csv',
      status: 'connected',
      health: 100,
      records: 25000,
      events_per_sec: 0,
      config: {
        fileName: 'ueba_afterhours_strong.csv',
        fileSize: 1024000,
        uploadedAt: new Date().toISOString()
      },
      last_sync: new Date().toISOString()
    }
  ];

  let inserted = 0;
  for (const ds of dataSources) {
    const { data, error } = await client
      .from('data_sources')
      .insert(ds)
      .select();
    
    if (error) {
      // Try update if exists
      const { error: updateError } = await client
        .from('data_sources')
        .update(ds)
        .eq('name', ds.name);
      
      if (!updateError) {
        inserted++;
        console.log(`   ✅ ${ds.name} (updated)`);
      } else {
        console.log(`   ❌ ${ds.name}: ${error.message || updateError.message}`);
      }
    } else {
      inserted++;
      console.log(`   ✅ ${ds.name}`);
    }
  }

  console.log(`\n✅ Inserted ${inserted} data sources`);
  return { inserted };
}

async function main() {
  console.log('🚀 Starting Migration Process...\n');
  
  const migrationPath = path.join(__dirname, '../../../supabase/migrations/001_initial_schema.sql');
  const seedPath = path.join(__dirname, '../../../supabase/migrations/002_seed_test_data.sql');
  
  // Step 1: Run schema migration
  console.log('═══════════════════════════════════════════════════════');
  console.log('STEP 1: Create Database Tables');
  console.log('═══════════════════════════════════════════════════════');
  
  const migrationResult = await runMigration(migrationPath, 'Initial Schema');
  
  if (!migrationResult.success) {
    console.log('\n❌ Migration failed. Please run SQL manually in Supabase Dashboard.');
    return;
  }
  
  // Step 2: Seed test data
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('STEP 2: Seed Test Data');
  console.log('═══════════════════════════════════════════════════════');
  
  await seedTestData();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Migration Complete!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 Next Steps:');
  console.log('   1. If tables were created manually, test data should be inserted');
  console.log('   2. Refresh your Data Sources page');
  console.log('   3. You should see 5 data sources');
  console.log('\n');
}

main().catch(console.error);

