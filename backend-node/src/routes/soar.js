import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { executePlaybook, checkAndExecuteAutoPlaybooks } from '../services/soarExecutor.js';

const router = express.Router();

// Get all playbooks
router.get('/playbooks', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('soar_playbooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Get single playbook
router.get('/playbooks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('soar_playbooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create playbook
router.post('/playbooks', async (req, res, next) => {
  try {
    const { name, description, action_type, conditions, action_config, enabled } = req.body;

    if (!name || !action_type) {
      return res.status(400).json({ error: 'Name and action_type are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('soar_playbooks')
      .insert({
        name,
        description: description || null,
        action_type,
        conditions: conditions || {},
        action_config: action_config || {},
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update playbook
router.patch('/playbooks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('soar_playbooks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete playbook
router.delete('/playbooks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('soar_playbooks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Execute playbook on alert(s)
router.post('/playbooks/:id/execute', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { alert_ids, triggered_by_user } = req.body;

    if (!alert_ids || !Array.isArray(alert_ids) || alert_ids.length === 0) {
      return res.status(400).json({ error: 'alert_ids array is required' });
    }

    const results = [];

    for (const alertId of alert_ids) {
      try {
        const result = await executePlaybook(id, alertId, 'manual', triggered_by_user || null);
        results.push(result);
      } catch (error) {
        results.push({
          alertId,
          success: false,
          message: error.message,
        });
      }
    }

    res.json({
      playbook_id: id,
      total: alert_ids.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Get execution history
router.get('/executions', async (req, res, next) => {
  try {
    const { playbook_id, alert_id, status, limit = 100, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('soar_executions')
      .select(`
        *,
        soar_playbooks(name, action_type),
        alerts(title, severity, status)
      `)
      .order('created_at', { ascending: false });

    if (playbook_id) {
      query = query.eq('playbook_id', playbook_id);
    }
    if (alert_id) {
      query = query.eq('alert_id', alert_id);
    }
    if (status) {
      query = query.eq('status', status);
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

export default router;



