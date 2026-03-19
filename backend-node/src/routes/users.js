import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Get all users with optional alert statistics
router.get('/', async (req, res, next) => {
  try {
    const { includeStats } = req.query;
    
    if (includeStats === 'true') {
      // Get users with alert statistics
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get alert counts and last alert time for each user
      const usersWithStats = await Promise.all(
        (users || []).map(async (user) => {
          // Count open alerts for this user
          const { count: alertCount, error: countError } = await supabaseAdmin
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('status', ['open', 'acknowledged', 'investigating']);

          if (countError) {
            console.error(`[Users API] Error counting alerts for user ${user.id}:`, countError);
          }

          // Get last alert time
          const { data: lastAlert, error: lastAlertError } = await supabaseAdmin
            .from('alerts')
            .select('created_at, title, severity')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastAlertError) {
            console.error(`[Users API] Error fetching last alert for user ${user.id}:`, lastAlertError);
          }

          // Get risk factors from open alerts
          const { data: openAlerts, error: alertsError } = await supabaseAdmin
            .from('alerts')
            .select('title, description, severity')
            .eq('user_id', user.id)
            .in('status', ['open', 'acknowledged', 'investigating'])
            .order('created_at', { ascending: false })
            .limit(5);

          if (alertsError) {
            console.error(`[Users API] Error fetching alerts for user ${user.id}:`, alertsError);
          }

          // Extract risk factors from alert titles
          const riskFactors = (openAlerts || []).map(alert => {
            // Extract key phrases from alert titles
            const title = alert.title || alert.description || '';
            if (title.includes('login') || title.includes('auth')) return 'Anomalous login';
            if (title.includes('file') || title.includes('access')) return 'Unusual file access';
            if (title.includes('privilege') || title.includes('escalation')) return 'Privilege escalation';
            if (title.includes('failed') || title.includes('attempt')) return 'Failed authentication';
            if (title.includes('after-hours') || title.includes('off-hours')) return 'After-hours access';
            if (title.includes('device') || title.includes('new')) return 'New device';
            if (title.includes('policy') || title.includes('violation')) return 'Policy violation';
            return title.substring(0, 30); // Truncate long titles
          }).filter((factor, index, self) => self.indexOf(factor) === index); // Remove duplicates

          return {
            ...user,
            alert_count: alertCount || 0,
            last_alert_time: lastAlert?.created_at || user.updated_at,
            risk_factors: riskFactors,
          };
        })
      );

      res.json(usersWithStats);
    } else {
      // Simple get all users without stats
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(data || []);
    }
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Suspend user account
router.patch('/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Force password reset
router.patch('/:id/force-password-reset', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const metadata = user.metadata || {};
    metadata.force_password_reset = true;
    metadata.password_reset_requested_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        metadata,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Trigger MFA challenge
router.patch('/:id/trigger-mfa', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const metadata = user.metadata || {};
    metadata.require_mfa = true;
    metadata.mfa_requested_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        metadata,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Revoke API tokens
router.patch('/:id/revoke-tokens', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('metadata')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const metadata = user.metadata || {};
    metadata.tokens_revoked = true;
    metadata.tokens_revoked_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        metadata,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      message: 'API tokens revoked (logged). Integrate with auth system for actual revocation.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;



