import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Seed test data endpoint (development only)
router.post('/test-data', async (req, res, next) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    // Insert data directly using Supabase client
    const seedResults = await seedTestData();

    res.json({
      message: 'Test data seeded successfully',
      results: seedResults,
      dataSources: seedResults.dataSources,
      users: seedResults.users
    });
  } catch (error) {
    console.error('Seed error:', error);
    next(error);
  }
});

async function seedTestData() {
  const results = { dataSources: 0, users: 0, alerts: 0 };

  // Seed data sources
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
      }
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
      }
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
      }
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
      }
    }
  ];

  const client = supabaseAdmin || supabase;
  
  for (const ds of dataSources) {
    const { error } = await client
      .from('data_sources')
      .upsert(ds, { onConflict: 'name' });
    if (!error) results.dataSources++;
    else console.error('Error inserting data source:', error);
  }

  // Seed users
  const users = [
    {
      email: 'john.doe@company.com',
      username: 'johndoe',
      risk_score: 45.5,
      status: 'active',
      metadata: { department: 'Engineering', role: 'Developer' }
    },
    {
      email: 'jane.smith@company.com',
      username: 'janesmith',
      risk_score: 72.3,
      status: 'active',
      metadata: { department: 'Sales', role: 'Manager' }
    },
    {
      email: 'admin@company.com',
      username: 'admin',
      risk_score: 15.2,
      status: 'active',
      metadata: { department: 'IT', role: 'Administrator' }
    }
  ];

  for (const user of users) {
    const { error } = await client
      .from('users')
      .upsert(user, { onConflict: 'email' });
    if (!error) results.users++;
    else console.error('Error inserting user:', error);
  }

  return results;
}

export default router;

