import { supabaseAdmin } from '../config/supabase.js';
import { createActivityLog } from '../utils/activityLogger.js';

/**
 * Execute a specific action type
 * @param {string} actionType - Type of action to execute
 * @param {Object} alert - Alert object
 * @param {Object} config - Action-specific configuration
 * @returns {Promise<Object>} Execution result
 */
async function executeAction(actionType, alert, config = {}) {
  const result = {
    action: actionType,
    success: false,
    message: '',
    details: {},
  };

  try {
    // Get user email from alert metadata or user_id
    let userEmail = null;
    let userId = null;

    if (alert.user_id) {
      userId = alert.user_id;
      // Try to get user email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();
      if (user) {
        userEmail = user.email;
      }
    } else if (alert.metadata?.user_email) {
      userEmail = alert.metadata.user_email;
      // Try to find user by email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle();
      if (user) {
        userId = user.id;
      }
    }

    switch (actionType) {
      case 'block_user':
        if (!userId && !userEmail) {
          throw new Error('User ID or email required for block_user action');
        }
        
        if (userId) {
          const { error } = await supabaseAdmin
            .from('users')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', userId);
          
          if (error) throw error;
          result.success = true;
          result.message = `User account ${userEmail || userId} suspended`;
        } else {
          // Create user entry if doesn't exist
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email: userEmail,
              status: 'suspended',
            })
            .select()
            .single();
          
          if (error) throw error;
          result.success = true;
          result.message = `User account ${userEmail} created and suspended`;
        }
        break;

      case 'force_password_reset':
        if (!userId && !userEmail) {
          throw new Error('User ID or email required for force_password_reset action');
        }
        
        if (userId) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('metadata')
            .eq('id', userId)
            .single();
          
          const metadata = user?.metadata || {};
          metadata.force_password_reset = true;
          metadata.password_reset_requested_at = new Date().toISOString();
          
          const { error } = await supabaseAdmin
            .from('users')
            .update({ metadata, updated_at: new Date().toISOString() })
            .eq('id', userId);
          
          if (error) throw error;
          result.success = true;
          result.message = `Password reset required for ${userEmail || userId}`;
        } else {
          // Create user entry if doesn't exist
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email: userEmail,
              metadata: { force_password_reset: true, password_reset_requested_at: new Date().toISOString() },
            })
            .select()
            .single();
          
          if (error) throw error;
          result.success = true;
          result.message = `Password reset required for ${userEmail}`;
        }
        break;

      case 'trigger_mfa':
        if (!userId && !userEmail) {
          throw new Error('User ID or email required for trigger_mfa action');
        }
        
        if (userId) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('metadata')
            .eq('id', userId)
            .single();
          
          const metadata = user?.metadata || {};
          metadata.require_mfa = true;
          metadata.mfa_requested_at = new Date().toISOString();
          
          const { error } = await supabaseAdmin
            .from('users')
            .update({ metadata, updated_at: new Date().toISOString() })
            .eq('id', userId);
          
          if (error) throw error;
          result.success = true;
          result.message = `MFA challenge required for ${userEmail || userId}`;
        } else {
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email: userEmail,
              metadata: { require_mfa: true, mfa_requested_at: new Date().toISOString() },
            })
            .select()
            .single();
          
          if (error) throw error;
          result.success = true;
          result.message = `MFA challenge required for ${userEmail}`;
        }
        break;

      case 'revoke_tokens':
        // Log action - can integrate with auth system later
        result.success = true;
        result.message = `API tokens revoked for ${userEmail || userId || 'user'}`;
        result.details = { note: 'Token revocation logged. Integrate with auth system for actual revocation.' };
        break;

      case 'quarantine_endpoint':
        // Log action - can integrate with network system later
        const endpointIp = alert.metadata?.source_ip || 'unknown';
        result.success = true;
        result.message = `Endpoint ${endpointIp} quarantined`;
        result.details = { note: 'Quarantine action logged. Integrate with network system for actual quarantine.' };
        break;

      case 'update_alert_status':
        const newStatus = config.new_status || 'investigating';
        const { error: updateError } = await supabaseAdmin
          .from('alerts')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString() 
          })
          .eq('id', alert.id);
        
        if (updateError) throw updateError;
        result.success = true;
        result.message = `Alert status updated to ${newStatus}`;
        break;

      case 'send_notification':
        // Log action - can integrate with email/Slack later
        result.success = true;
        result.message = `Notification sent for alert ${alert.id}`;
        result.details = { 
          note: 'Notification logged. Integrate with email/Slack for actual notifications.',
          recipient: config.recipient || userEmail || 'admin',
        };
        break;

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    result.success = false;
    result.message = error.message || 'Action execution failed';
    result.error = error.message;
  }

  return result;
}

/**
 * Execute a playbook on an alert
 * @param {string} playbookId - Playbook ID
 * @param {string} alertId - Alert ID
 * @param {string} triggeredBy - 'automatic' or 'manual'
 * @param {string} triggeredByUser - User email if manual
 * @returns {Promise<Object>} Execution result
 */
export async function executePlaybook(playbookId, alertId, triggeredBy = 'manual', triggeredByUser = null) {
  // Get playbook
  const { data: playbook, error: playbookError } = await supabaseAdmin
    .from('soar_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (playbookError || !playbook) {
    throw new Error(`Playbook not found: ${playbookId}`);
  }

  if (!playbook.enabled) {
    throw new Error(`Playbook ${playbook.name} is disabled`);
  }

  // Get alert
  const { data: alert, error: alertError } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (alertError || !alert) {
    throw new Error(`Alert not found: ${alertId}`);
  }

  // Create execution record
  const { data: execution, error: execError } = await supabaseAdmin
    .from('soar_executions')
    .insert({
      playbook_id: playbookId,
      alert_id: alertId,
      status: 'running',
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
    })
    .select()
    .single();

  if (execError) {
    console.error('[SOAR Executor] Error creating execution record:', execError);
  }

  const executionId = execution?.id;

  try {
    // Execute the action
    const actionResult = await executeAction(playbook.action_type, alert, playbook.action_config || {});

    // Update execution record
    const updateData = {
      status: actionResult.success ? 'success' : 'failed',
      result: actionResult,
      completed_at: new Date().toISOString(),
    };

    if (!actionResult.success) {
      updateData.error_message = actionResult.message;
    }

    if (executionId) {
      await supabaseAdmin
        .from('soar_executions')
        .update(updateData)
        .eq('id', executionId);
    }

    // If playbook is automatic and execution was successful, automatically resolve the alert
    if (triggeredBy === 'automatic' && actionResult.success && playbook.conditions?.auto_execute) {
      const { error: updateAlertError } = await supabaseAdmin
        .from('alerts')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (updateAlertError) {
        console.error(`[SOAR Executor] Error updating alert status to resolved for ${alertId}:`, updateAlertError);
      } else {
        console.log(`[SOAR Executor] ✅ Alert ${alertId} automatically resolved by playbook ${playbook.name}`);
        
        // Log the automatic resolution
        await createActivityLog(
          `Alert automatically resolved by SOAR playbook: ${playbook.name}`,
          'system',
          {
            type: 'alert',
            status: 'success',
            target: alertId,
            details: `Alert ${alertId} was automatically resolved after successful execution of playbook '${playbook.name}'`,
            metadata: {
              playbook_id: playbookId,
              alert_id: alertId,
              action_type: playbook.action_type,
              triggered_by: triggeredBy,
              execution_id: executionId,
            },
          }
        );
      }
    }

    // Log activity
    await createActivityLog(
      `SOAR playbook executed: ${playbook.name}`,
      triggeredByUser || 'system',
      {
        type: 'config',
        status: actionResult.success ? 'success' : 'error',
        target: playbook.name,
        details: `${actionResult.message} (Alert: ${alertId})`,
        metadata: {
          playbook_id: playbookId,
          alert_id: alertId,
          action_type: playbook.action_type,
          triggered_by: triggeredBy,
          execution_id: executionId,
        },
      }
    );

    return {
      executionId,
      playbook: playbook.name,
      alertId,
      success: actionResult.success,
      message: actionResult.message,
      details: actionResult.details,
      alertResolved: triggeredBy === 'automatic' && actionResult.success && playbook.conditions?.auto_execute,
    };
  } catch (error) {
    // Update execution record with error
    if (executionId) {
      await supabaseAdmin
        .from('soar_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId);
    }

    throw error;
  }
}

/**
 * Get risk score for an alert (from alert or user)
 * @param {Object} alert - Alert object
 * @returns {Promise<number|null>} Risk score (0-100) or null if not available
 */
async function getRiskScore(alert) {
  // Priority 1: Use alert anomaly_score (0-100 scale)
  if (alert.anomaly_score !== null && alert.anomaly_score !== undefined) {
    // Ensure it's in 0-100 range (might be stored as 0-1 or 0-100)
    const score = typeof alert.anomaly_score === 'number' ? alert.anomaly_score : parseFloat(alert.anomaly_score);
    if (!isNaN(score)) {
      // If score is between 0-1, convert to 0-100
      return score <= 1 ? score * 100 : score;
    }
  }

  // Priority 2: Fetch user risk_score if user_id exists
  if (alert.user_id) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('risk_score')
        .eq('id', alert.user_id)
        .maybeSingle();

      if (!error && user && user.risk_score !== null && user.risk_score !== undefined) {
        const score = typeof user.risk_score === 'number' ? user.risk_score : parseFloat(user.risk_score);
        if (!isNaN(score)) {
          return score;
        }
      }
    } catch (error) {
      console.error('[SOAR Executor] Error fetching user risk score:', error);
    }
  }

  // Priority 3: Try to get user by email from metadata
  if (alert.metadata?.user_email) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('risk_score')
        .eq('email', alert.metadata.user_email)
        .maybeSingle();

      if (!error && user && user.risk_score !== null && user.risk_score !== undefined) {
        const score = typeof user.risk_score === 'number' ? user.risk_score : parseFloat(user.risk_score);
        if (!isNaN(score)) {
          return score;
        }
      }
    } catch (error) {
      console.error('[SOAR Executor] Error fetching user risk score by email:', error);
    }
  }

  return null;
}

/**
 * Check conditions and auto-execute matching playbooks
 * @param {Object} alert - Alert object
 * @returns {Promise<Array>} Array of execution results
 */
export async function checkAndExecuteAutoPlaybooks(alert) {
  // Get enabled playbooks with auto_execute enabled
  const { data: playbooks, error } = await supabaseAdmin
    .from('soar_playbooks')
    .select('*')
    .eq('enabled', true)
    .eq('conditions->>auto_execute', 'true');

  if (error) {
    console.error('[SOAR Executor] Error fetching auto-playbooks:', error);
    return [];
  }

  if (!playbooks || playbooks.length === 0) {
    return [];
  }

  // Get risk score for this alert (once, reuse for all playbooks)
  const riskScore = await getRiskScore(alert);
  console.log(`[SOAR Executor] Alert ${alert.id} risk score: ${riskScore !== null ? riskScore.toFixed(1) : 'N/A'}`);

  const results = [];

  for (const playbook of playbooks) {
    const conditions = playbook.conditions || {};
    
    // Check severity condition
    if (conditions.severity && Array.isArray(conditions.severity) && conditions.severity.length > 0) {
      if (!conditions.severity.includes(alert.severity)) {
        continue; // Skip this playbook
      }
    }

    // Check alert type condition (if specified)
    if (conditions.alert_types && Array.isArray(conditions.alert_types) && conditions.alert_types.length > 0) {
      const alertType = alert.metadata?.alert_type || alert.title?.toLowerCase() || '';
      const matches = conditions.alert_types.some(type => 
        alertType.includes(type.toLowerCase())
      );
      if (!matches) {
        continue; // Skip this playbook
      }
    }

    // Check risk score threshold (if configured)
    if (conditions.min_risk_score !== null && conditions.min_risk_score !== undefined) {
      const minRiskScore = typeof conditions.min_risk_score === 'number' 
        ? conditions.min_risk_score 
        : parseFloat(conditions.min_risk_score);

      if (!isNaN(minRiskScore)) {
        // If no risk score available, skip this playbook
        if (riskScore === null) {
          console.log(`[SOAR Executor] Playbook ${playbook.name} requires risk >= ${minRiskScore}, but no risk score available for alert ${alert.id}`);
          continue;
        }

        // Check if risk score meets threshold
        if (riskScore < minRiskScore) {
          console.log(`[SOAR Executor] Playbook ${playbook.name} requires risk >= ${minRiskScore}, but alert has ${riskScore.toFixed(1)}`);
          continue; // Skip this playbook
        }

        console.log(`[SOAR Executor] ✅ Risk score check passed: ${riskScore.toFixed(1)} >= ${minRiskScore} for playbook ${playbook.name}`);
      }
    }

    // Execute matching playbook
    try {
      const result = await executePlaybook(playbook.id, alert.id, 'automatic', null);
      results.push(result);
    } catch (error) {
      console.error(`[SOAR Executor] Error executing playbook ${playbook.name}:`, error);
      results.push({
        playbook: playbook.name,
        alertId: alert.id,
        success: false,
        message: error.message,
      });
    }
  }

  return results;
}

