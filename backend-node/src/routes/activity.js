import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Get all activity logs
router.get('/', async (req, res, next) => {
  try {
    const { type, status, search, limit = 100, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by type
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Search in action, actor, target, or details
    if (search) {
      query = query.or(`action.ilike.%${search}%,actor.ilike.%${search}%,target.ilike.%${search}%,details.ilike.%${search}%`);
    }
    
    // Pagination
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



