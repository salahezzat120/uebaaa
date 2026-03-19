import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { createActivityLog } from '../utils/activityLogger.js';
import { generateReport } from '../services/reportGenerator.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Get all reports
router.get('/', async (req, res, next) => {
  try {
    const { type, status, frequency } = req.query;
    
    let query = supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (frequency && frequency !== 'all') {
      query = query.eq('frequency', frequency);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create new report
router.post('/', async (req, res, next) => {
  try {
    const { name, description, type, frequency, template_id, metadata } = req.body;

    if (!name || !type || !frequency) {
      return res.status(400).json({ error: 'Name, type, and frequency are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        name,
        description,
        type,
        frequency,
        template_id,
        status: 'ready',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    await createActivityLog('Report created', req.headers['x-user-email'] || 'system', {
      type: 'config',
      status: 'success',
      target: data.name,
      details: `Report '${data.name}' (${data.type}, ${data.frequency}) created.`,
      metadata: { report_id: data.id, type: data.type, frequency: data.frequency },
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update report
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await createActivityLog('Report updated', req.headers['x-user-email'] || 'system', {
      type: 'config',
      status: 'success',
      target: data.name,
      details: `Report '${data.name}' updated.`,
      metadata: { report_id: data.id, updates: updates },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete report
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('name, file_path')
      .eq('id', id)
      .single();

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete file if exists
    if (report.file_path) {
      try {
        const filePath = path.join(process.cwd(), 'reports', report.file_path);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('[Reports API] Error deleting report file:', fileError);
        // Continue with deletion even if file deletion fails
      }
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await createActivityLog('Report deleted', req.headers['x-user-email'] || 'system', {
      type: 'config',
      status: 'success',
      target: report.name,
      details: `Report '${report.name}' deleted.`,
      metadata: { report_id: id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Generate report
router.post('/:id/generate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timePeriod, customStart, customEnd } = req.body;

    const { data: report, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status === 'generating') {
      return res.status(400).json({ error: 'Report is already being generated' });
    }

    // Update status to generating
    await supabaseAdmin
      .from('reports')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Create generation record
    const { data: generation, error: genError } = await supabaseAdmin
      .from('report_generations')
      .insert({
        report_id: id,
        status: 'generating',
        started_at: new Date().toISOString(),
        metadata: {
          timePeriod,
          customStart,
          customEnd,
        },
      })
      .select()
      .single();

    if (genError) {
      console.error('[Reports API] Error creating generation record:', genError);
    }

    // Generate report asynchronously (don't wait for completion)
    generateReport(report, generation?.id, timePeriod, customStart, customEnd)
      .catch(error => {
        console.error(`[Reports API] Error generating report ${id}:`, error);
      });

    res.json({ 
      message: 'Report generation started',
      generation_id: generation?.id,
      time_period: timePeriod || report.frequency,
    });
  } catch (error) {
    next(error);
  }
});

// Download report
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!report.file_path || report.status !== 'ready') {
      return res.status(400).json({ error: 'Report file not available. Please generate the report first.' });
    }

    const filePath = path.join(process.cwd(), 'reports', report.file_path);
    
    try {
      await fs.access(filePath);
      res.download(filePath, `${report.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    } catch (fileError) {
      return res.status(404).json({ error: 'Report file not found on server' });
    }
  } catch (error) {
    next(error);
  }
});

// Schedule report
router.post('/:id/schedule', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { next_scheduled_at } = req.body;

    if (!next_scheduled_at) {
      return res.status(400).json({ error: 'next_scheduled_at is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({ 
        next_scheduled_at,
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await createActivityLog('Report scheduled', req.headers['x-user-email'] || 'system', {
      type: 'config',
      status: 'success',
      target: data.name,
      details: `Report '${data.name}' scheduled for ${next_scheduled_at}.`,
      metadata: { report_id: data.id, next_scheduled_at },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

