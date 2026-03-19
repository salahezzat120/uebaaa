import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { createActivityLog } from '../utils/activityLogger.js';
import { checkAndExecuteAutoPlaybooks } from '../services/soarExecutor.js';

const router = express.Router();

// Get all alerts
router.get('/', async (req, res, next) => {
  try {
    const { status, severity, limit = 100, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Get alert by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create alert
router.post('/', async (req, res, next) => {
  try {
    const alert = req.body;

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;

    // Check and execute auto-playbooks for new alert
    if (data) {
      try {
        await checkAndExecuteAutoPlaybooks(data);
      } catch (soarError) {
        console.error('[Alerts Route] Error executing auto-playbooks:', soarError);
        // Don't fail alert creation if SOAR fails
      }
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update alert (mainly status)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Log activity when status changes
    if (updates.status) {
      const statusActions = {
        'acknowledged': 'Alert acknowledged',
        'investigating': 'Alert investigated',
        'resolved': 'Alert resolved',
        'false_positive': 'Alert dismissed',
        'dismissed': 'Alert dismissed',
      };
      
      const action = statusActions[updates.status] || `Alert status updated to ${updates.status}`;
      const actor = req.body.actor || req.headers['x-user-email'] || 'system';
      
      await createActivityLog(action, actor, {
        type: 'alert',
        status: 'success',
        target: id,
        details: updates.status === 'resolved' 
          ? 'Alert resolved and closed'
          : updates.status === 'false_positive' || updates.status === 'dismissed'
          ? 'Marked as false positive'
          : `Status changed to ${updates.status}`,
        metadata: { alert_id: id, previous_status: data.status, new_status: updates.status },
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete alert
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get alert info before deletion for activity log
    const { data: alert } = await supabaseAdmin
      .from('alerts')
      .select('title')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog('Alert deleted', actor, {
      type: 'alert',
      status: 'success',
      target: id,
      details: alert ? `Deleted alert: ${alert.title}` : 'Alert deleted',
      metadata: { alert_id: id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;


