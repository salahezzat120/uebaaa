import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { retrySupabaseQuery } from '../utils/supabaseRetry.js';
import { startLogstashProcessor, stopLogstashProcessor } from '../services/logstashProcessor.js';
import { createActivityLog } from '../utils/activityLogger.js';
// Note: aiService import removed - FastAPI backend is optional

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all data sources
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array (graceful fallback)
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('Data sources table does not exist yet. Run the Supabase migration.');
        return res.json([]);
      }
      throw error;
    }

    // Calculate stats from processed_rows table for each data source
    const dataSourcesWithStats = await Promise.all((data || []).map(async (ds) => {
      try {
        // Get count of processed rows with retry logic
        const { count: recordsCount, error: countError } = await retrySupabaseQuery(
          () => supabase
            .from('processed_rows')
            .select('*', { count: 'exact', head: true })
            .eq('data_source_id', ds.id),
          2 // 2 retries for stats queries (less critical)
        ).catch(() => ({ count: null, error: null })); // Gracefully fail stats

        if (countError) {
          console.error(`Error counting records for data source ${ds.id}:`, countError);
        }

        // Get events per second (based on recent processed_at timestamps)
        // Calculate from last 5 minutes for more accurate real-time rate
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: recentCount, error: recentError } = await retrySupabaseQuery(
          () => supabase
            .from('processed_rows')
            .select('*', { count: 'exact', head: true })
            .eq('data_source_id', ds.id)
            .gte('processed_at', fiveMinutesAgo),
          2 // 2 retries for stats queries
        ).catch(() => ({ count: null, error: null })); // Gracefully fail stats

        if (recentError) {
          console.error(`Error counting recent records for data source ${ds.id}:`, recentError);
        }

        // Calculate events per second from last 5 minutes
        // If we have recent activity, calculate rate; otherwise use 0
        let eventsPerSec = 0;
        if (recentCount && recentCount > 0) {
          // Rate = count / time window in seconds (5 minutes = 300 seconds)
          eventsPerSec = parseFloat((recentCount / 300).toFixed(3));
        }

        // Update data source with calculated stats
        const updatedRecords = recordsCount || 0;
        const updatedEventsPerSec = eventsPerSec;

        // Update health based on records and activity
        let health = 100; // Default to healthy
        if (ds.type === 'csv') {
          if (updatedRecords > 0) {
            health = 100; // CSV sources with records are healthy
          } else {
            health = ds.health || 100; // Keep existing health if no records
          }
        } else {
          // For other types, health might depend on connection status
          if (ds.status === 'connected' && updatedRecords > 0) {
            health = 100;
          } else if (ds.status === 'error') {
            health = 50;
          } else if (ds.status === 'disconnected') {
            health = 0;
          } else {
            health = ds.health || 100;
          }
        }

        // Always return the calculated stats (don't just update if changed)
        return {
          ...ds,
          records: updatedRecords,
          events_per_sec: updatedEventsPerSec,
          health: health,
        };
      } catch (statsError) {
        console.error(`Error calculating stats for data source ${ds.id}:`, statsError);
        // Return original data source if stats calculation fails
        return ds;
      }
    }));

    res.json(dataSourcesWithStats || []);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    // Return empty array on error to prevent frontend crashes
    res.json([]);
  }
});

// Get single data source
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create data source
router.post('/', async (req, res, next) => {
  try {
    const { name, type, config } = req.body;

    const { data, error } = await supabase
      .from('data_sources')
      .insert({
        name,
        type,
        config: config || {},
        status: 'disconnected',
        health: 0,
        records: 0,
        events_per_sec: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update data source
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('data_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete data source
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Connect data source
router.post('/:id/connect', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get data source details first
    const { data: dataSource, error: fetchError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!dataSource) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    // Update status
    const { data, error } = await supabase
      .from('data_sources')
      .update({
        status: 'connected',
        health: 95,
        events_per_sec: 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    // Start Logstash processor if type is logstash
    if (dataSource.type === 'logstash') {
      console.log(`[Data Sources] Starting Logstash processor for data source ${id}`);
      const intervalMs = req.body.intervalMs || 2000; // Default: 1 log every 2 seconds
      startLogstashProcessor(id, { intervalMs });
    }

    // Log activity
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog('Data source connected', actor, {
      type: 'data',
      status: 'success',
      target: dataSource.name,
      details: `Data source ${dataSource.name} (${dataSource.type}) connected`,
      metadata: { data_source_id: id, data_source_name: dataSource.name, type: dataSource.type },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Disconnect data source
router.post('/:id/disconnect', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get data source type before updating
    const { data: dataSource } = await supabase
      .from('data_sources')
      .select('type')
      .eq('id', id)
      .single();

    // Stop Logstash processor if type is logstash
    if (dataSource?.type === 'logstash') {
      console.log(`[Data Sources] Stopping Logstash processor for data source ${id}`);
      stopLogstashProcessor(id);
    }

    const { data, error } = await supabase
      .from('data_sources')
      .update({
        status: 'disconnected',
        health: 0,
        events_per_sec: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    // Log activity
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog('Data source disconnected', actor, {
      type: 'data',
      status: 'success',
      target: dataSource?.name || id,
      details: `Data source ${dataSource?.name || id} disconnected`,
      metadata: { data_source_id: id, data_source_name: dataSource?.name },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Sync data source
router.post('/:id/sync', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update status to syncing
    const { data: syncingData, error: updateError } = await supabase
      .from('data_sources')
      .update({
        status: 'syncing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Simulate sync process (in real app, this would trigger background job)
    setTimeout(async () => {
      const { data, error } = await supabase
        .from('data_sources')
        .update({
          status: 'connected',
          last_sync: new Date().toISOString(),
          records: (syncingData?.records || 0) + Math.floor(Math.random() * 10000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) console.error('Sync completion error:', error);
    }, 2000);

    res.json(syncingData);
  } catch (error) {
    next(error);
  }
});

// Upload CSV file
router.post('/upload-csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name } = req.body;
    const file = req.file;

    // Parse CSV to count rows
    const text = file.buffer.toString('utf-8');
    const lines = text.split('\n').filter(line => line.trim());
    const recordCount = Math.max(0, lines.length - 1); // Subtract header

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.originalname}`;
    
    // Check if admin client is available
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available. SUPABASE_SERVICE_ROLE_KEY is required for file uploads.');
    }
    
    // Validate service role key format
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || !serviceKey.trim().startsWith('eyJ')) {
      throw new Error(
        'Invalid service role key format. Expected JWT token starting with "eyJ". ' +
        'Get the correct key from Supabase Dashboard → Settings → API → service_role key. ' +
        'Make sure you copied the FULL key (it should be very long).'
      );
    }
    
    console.log('[CSV Upload] Attempting to upload to Supabase Storage...');
    console.log('[CSV Upload] Bucket: csv-files, File:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('csv-files')
      .upload(fileName, file.buffer, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (uploadError) {
      console.error('[CSV Upload] Storage upload error:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        hasServiceRole: !!supabaseAdmin
      });
      
      // Provide helpful error message
      if (uploadError.message.includes('JWT') || uploadError.message.includes('JWS')) {
        throw new Error(`Supabase authentication error: ${uploadError.message}. Please check your SUPABASE_SERVICE_ROLE_KEY in .env file.`);
      }
      
      throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
    }
    
    console.log('[CSV Upload] File uploaded successfully:', fileName);

    // Get public URL (use admin client for consistency)
    const { data: urlData } = supabaseAdmin
      .storage
      .from('csv-files')
      .getPublicUrl(fileName);

    // Create data source record
    const { data, error } = await supabase
      .from('data_sources')
      .insert({
        name: name || file.originalname.replace('.csv', ''),
        type: 'csv',
        status: 'connected',
        health: 100,
        records: recordCount,
        events_per_sec: 0,
        config: {
          fileName: file.originalname,
          fileSize: file.size,
          storagePath: fileName,
          storageUrl: urlData.publicUrl,
          uploadedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Save processed rows to database
router.post('/:id/processed-rows', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Rows array is required and must not be empty' });
    }

    // Verify data source exists
    const { data: dataSource, error: sourceError } = await supabase
      .from('data_sources')
      .select('id')
      .eq('id', id)
      .single();

    if (sourceError || !dataSource) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    // Transform and insert rows
    const rowsToInsert = rows.map(row => ({
      data_source_id: id,
      row_number: row.row_number,
      user_id: row.user_id || null,
      timestamp: row.timestamp || null,
      action: row.action || null,
      source_ip: row.source_ip || null,
      resource: row.resource || null,
      status: row.status || null,
      anomaly_score: row.anomaly_score ? parseFloat(row.anomaly_score) : null,
      is_anomaly: row.is_anomaly || false,
      features: row.features ? (typeof row.features === 'string' ? JSON.parse(row.features) : row.features) : null,
      processed_at: new Date().toISOString(),
    }));

    console.log(`[Save Processed Rows] Preparing to insert ${rowsToInsert.length} rows for data source ${id}`);
    if (rowsToInsert.length > 0) {
      console.log(`[Save Processed Rows] Sample row:`, {
        row_number: rowsToInsert[0].row_number,
        user_id: rowsToInsert[0].user_id,
        anomaly_score: rowsToInsert[0].anomaly_score,
        is_anomaly: rowsToInsert[0].is_anomaly,
      });
    }

    // Use admin client for insert (required for RLS)
    const { data, error } = await (supabaseAdmin || supabase)
      .from('processed_rows')
      .insert(rowsToInsert)
      .select();

    if (error) {
      console.error('[Save Processed Rows] Database error:', error);
      throw error;
    }

    // Update data source record count
    await supabase
      .from('data_sources')
      .update({ 
        records: rows.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    console.log(`[Save Processed Rows] Saved ${rows.length} rows for data source ${id}`);

    res.json({ 
      success: true, 
      saved: data?.length || 0,
      message: `Saved ${rows.length} processed rows` 
    });
  } catch (error) {
    next(error);
  }
});

// Get processed rows for a data source
router.get('/:id/processed-rows', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 1000, offset = 0, anomaly_only } = req.query;

    let query = supabase
      .from('processed_rows')
      .select('*')
      .eq('data_source_id', id)
      .order('row_number', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (anomaly_only === 'true') {
      query = query.eq('is_anomaly', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Download CSV file from storage (for replay)
router.get('/:id/download-csv', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get data source
    const { data: dataSource, error: sourceError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (sourceError || !dataSource) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    if (dataSource.type !== 'csv') {
      return res.status(400).json({ error: 'Data source is not a CSV file' });
    }

    const storagePath = dataSource.config?.storagePath;
    if (!storagePath) {
      return res.status(404).json({ error: 'CSV file not found in storage' });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('csv-files')
      .download(storagePath);

    if (downloadError) {
      console.error('[Download CSV] Storage error:', downloadError);
      throw new Error(`Failed to download CSV from storage: ${downloadError.message}`);
    }

    // Convert blob to buffer and send as response
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataSource.config?.fileName || dataSource.name}.csv"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Reprocess CSV (replay)
router.post('/:id/reprocess', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get data source
    const { data: dataSource, error: sourceError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (sourceError || !dataSource) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    if (dataSource.type !== 'csv') {
      return res.status(400).json({ error: 'Data source is not a CSV file' });
    }

    const storagePath = dataSource.config?.storagePath;
    if (!storagePath) {
      return res.status(404).json({ error: 'CSV file not found in storage' });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('csv-files')
      .download(storagePath);

    if (downloadError) {
      throw new Error(`Failed to download CSV: ${downloadError.message}`);
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for the upload endpoint
    // Return file info and storage path so frontend can trigger reprocessing
    res.json({
      success: true,
      fileName: dataSource.config?.fileName || dataSource.name,
      fileSize: buffer.length,
      storagePath: storagePath,
      message: 'CSV file ready for reprocessing. Frontend should download and process it.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

