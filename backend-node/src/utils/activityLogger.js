import { supabaseAdmin } from '../config/supabase.js';

/**
 * Create an activity log entry
 * @param {string} action - The action performed (e.g., "Alert investigated", "Model uploaded")
 * @param {string} actor - The actor who performed the action (email, user_id, or "system")
 * @param {Object} options - Additional options
 * @param {string} options.type - Type of activity: 'auth', 'config', 'alert', 'model', 'data'
 * @param {string} options.status - Status: 'success', 'warning', 'error'
 * @param {string} [options.target] - Target of the action (e.g., alert ID, model name)
 * @param {string} [options.details] - Detailed description of the action
 * @param {Object} [options.metadata] - Additional metadata as JSON object
 * @returns {Promise<void>}
 */
export async function createActivityLog(action, actor, options = {}) {
  try {
    const {
      type,
      status = 'success',
      target = null,
      details = null,
      metadata = {}
    } = options;

    if (!type) {
      console.error('[Activity Logger] Type is required');
      return;
    }

    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        action,
        actor: actor || 'system',
        target,
        type,
        status,
        details,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Activity Logger] Error creating activity log:', error);
      // Don't throw - activity logging should not break main operations
    }
  } catch (error) {
    console.error('[Activity Logger] Unexpected error:', error);
    // Don't throw - activity logging should not break main operations
  }
}



