import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { riskScoringService } from '../services/riskScoringService.js';

const router = express.Router();

// Get all system settings
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('system_settings').select('*');
    if (error) throw error;
    
    // Format into a more usable object
    const settings = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update specific setting
router.patch('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Setting not found' });

    // Refresh the service settings
    await riskScoringService.initialize();

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get risk scoring specific settings
router.get('/risk-scoring', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .in('key', ['risk_weights', 'risk_thresholds', 'risk_fusion']);
    
    if (error) throw error;
    
    const settings = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

export default router;
