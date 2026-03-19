import { supabaseAdmin } from '../config/supabase.js';
import axios from 'axios';
import { createActivityLog } from '../utils/activityLogger.js';
import { checkAndExecuteAutoPlaybooks } from './soarExecutor.js';
import { riskScoringService } from './riskScoringService.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Store active processors
const activeProcessors = new Map();

// Generate test log entry (similar format to CSV data)
function generateTestLog() {
  const actions = ['login', 'access_file', 'download_file', 'upload_file', 'admin_action', 'execute_script'];
  const statuses = ['success', 'failed'];
  const users = [
    'john.doe@company.com',
    'jane.smith@company.com',
    'bob.jones@company.com',
    'alice.brown@company.com',
    'admin@company.com'
  ];
  
  // Generate some anomalies (higher chance during off-hours or with failed status)
  const hour = new Date().getHours();
  const isOffHours = hour < 8 || hour > 18;
  const shouldBeAnomaly = Math.random() < (isOffHours ? 0.3 : 0.1); // 30% chance off-hours, 10% during hours
  
  const actionIndex = shouldBeAnomaly && Math.random() > 0.5 ? 5 : Math.floor(Math.random() * 5); // More likely to be script execution
  const status = shouldBeAnomaly && Math.random() > 0.4 ? 'failed' : (Math.random() > 0.1 ? 'success' : 'failed');
  
  // Generate IP (more likely external IP for anomalies)
  let ip;
  if (shouldBeAnomaly && Math.random() > 0.3) {
    // External IP
    ip = `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  } else {
    // Internal IP
    ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
  
  return {
    user_id: users[Math.floor(Math.random() * users.length)],
    timestamp: new Date().toISOString(),
    action: actions[actionIndex],
    source_ip: ip,
    resource: `/api/${actions[actionIndex].replace('_', '/')}${Math.random() > 0.7 ? '/sensitive' : ''}`,
    status: status,
  };
}

// Extract features from log entry (same as CSV processor)
function extractFeatures(log) {
  // Action mapping (same as frontend)
  const actionMap = {
    'login': 0,
    'access_file': 1,
    'download_file': 2,
    'upload_file': 3,
    'admin_action': 4,
    'execute_script': 5,
  };
  
  // Status mapping
  const statusMap = { 'success': 1, 'failed': 0 };
  
  // Parse IP
  const ipParts = log.source_ip.split('.').map(Number);
  const [ip1, ip2, ip3, ip4] = ipParts;
  
  // Parse timestamp
  const timestamp = new Date(log.timestamp);
  const hour = timestamp.getHours();
  
  // Hash user ID (simple hash)
  const userIdHash = log.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
  
  // Resource length
  const resourceLength = (log.resource || '').length;
  
  // Return normalized features [action, status, ip1/255, ip2/255, ip3/255, ip4/255, hour/24, userIdHash/100, resourceLength/100, ...]
  return [
    (actionMap[log.action] || 0) / 5, // Normalized action (0-1)
    statusMap[log.status] || 0, // Status (0 or 1)
    ip1 / 255, // Normalized IP parts
    ip2 / 255,
    ip3 / 255,
    ip4 / 255,
    hour / 24, // Normalized hour
    userIdHash / 100, // Normalized user hash
    Math.min(1, resourceLength / 100), // Normalized resource length
    0, // Placeholder for additional features
    0, // Placeholder
  ];
}

// Process single log entry through AI model
async function processLogEntry(log, dataSourceId, featureWindow, rowNumber) {
  try {
    // Extract features
    const features = extractFeatures(log);
    
    // Add to sliding window (keep last 7 timesteps for LSTM)
    featureWindow.push(features);
    if (featureWindow.length > 7) {
      featureWindow.shift();
    }
    
    // Pad if needed (at least 7 timesteps required)
    let sequence = featureWindow;
    if (sequence.length < 7) {
      const padding = Array(7 - sequence.length).fill(sequence[0] || features);
      sequence = [...padding, ...sequence];
    }
    
    // Call AI service via the Node.js backend API route (which handles ensemble prediction)
    const response = await axios.post(`${API_BASE_URL}/api/ai/predict`, {
      features: sequence,
      useAllActive: true, // Use all active models
    });
    
    const prediction = response.data;
    const anomalyScore = prediction.anomalyScore || 0;
    
    // Use Advanced Risk Scoring Engine
    const riskResult = await riskScoringService.calculateRiskScore(log, anomalyScore);
    const finalRiskScore = riskResult.riskScore;
    const severity = riskResult.severity;
    const isAnomalyHigh = finalRiskScore >= 50; // Use risk score threshold instead of just anomaly score
    
    // Save to processed_rows
    const { error: saveError } = await supabaseAdmin
      .from('processed_rows')
      .insert({
        data_source_id: dataSourceId,
        row_number: rowNumber,
        user_id: log.user_id,
        timestamp: log.timestamp,
        action: log.action,
        source_ip: log.source_ip,
        resource: log.resource,
        status: log.status,
        anomaly_score: finalRiskScore, // Use final risk score
        is_anomaly: isAnomalyHigh,
        features: features,
        processed_at: new Date().toISOString(),
      });
    
    if (saveError) {
      console.error(`[Logstash Processor] Error saving processed row:`, saveError);
      throw saveError;
    }
    
    // Create alert if risk is significant
    if (isAnomalyHigh && finalRiskScore >= 50) {
      const alertType = log.action === 'execute_script' ? 'insider_threat' : 
                       log.status === 'failed' && log.action === 'login' ? 'account_compromise' :
                       'entity_anomaly';
      
      // Get model name for metadata (alerts table doesn't have a 'model' column)
      const modelName = prediction.modelsUsed?.[0]?.name || 'Ensemble';
      
      // Try to find user UUID by email (user_id in logs is email, but alerts table expects UUID)
      let userId = null;
      if (log.user_id) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', log.user_id)
          .maybeSingle();
        if (user) {
          userId = user.id;
        }
      }
      
      const { data: createdAlertData, error: alertError } = await supabaseAdmin
        .from('alerts')
        .insert({
          title: `Anomaly Detected: ${alertType}`,
          description: `Anomaly detected: ${log.action} ${log.status} from ${log.source_ip}`,
          severity: severity,
          status: 'open',
          user_id: userId, // UUID or null if user not found
          data_source_id: dataSourceId,
          anomaly_score: Math.round(finalRiskScore),
          metadata: {
            action: log.action,
            source_ip: log.source_ip,
            resource: log.resource,
            status: log.status,
            user_email: log.user_id,
            model: modelName,
            models_used: prediction.modelsUsed || [],
            risk_components: riskResult.components, // Store the 5-component breakdown
          },
        })
        .select()
        .single();
      
      if (alertError) {
        console.error(`[Logstash Processor] Error creating alert:`, alertError);
      } else {
        console.log(`[Logstash Processor] ✅ Alert created: ${alertType} (${severity}) - ${log.user_id}`);
        
        // Check and execute auto-playbooks
        if (createdAlertData) {
          try {
            const soarResults = await checkAndExecuteAutoPlaybooks(createdAlertData);
            if (soarResults.length > 0) {
              console.log(`[Logstash Processor] 🔄 Executed ${soarResults.length} auto-playbook(s) for alert`);
            }
          } catch (soarError) {
            console.error(`[Logstash Processor] Error executing auto-playbooks:`, soarError);
            // Don't fail alert creation if SOAR fails
          }
        }
        
        // Log activity when alert is created from anomaly detection
        await createActivityLog('Alert created', 'system', {
          type: 'alert',
          status: 'warning',
          target: `${alertType} - ${log.user_id}`,
          details: `Anomaly detected: ${log.action} ${log.status} from ${log.source_ip} (score: ${Math.round(anomalyScore * 100)})`,
          metadata: { 
            alert_type: alertType,
            severity,
            user_email: log.user_id,
            anomaly_score: Math.round(anomalyScore * 100),
            model: modelName,
          },
        });
      }
    }
    
    const result = {
      log,
      anomalyScore,
      isAnomaly: isAnomalyHigh,
      prediction,
    };
    
    // Update user baseline periodically (every 10 logs)
    if (userId && rowNumber % 10 === 0) {
      riskScoringService.updateUserBaseline(userId).catch(e => 
        console.error(`[Logstash Processor] Baseline update failed for ${userId}:`, e)
      );
    }
    
    return result;
  } catch (error) {
    console.error(`[Logstash Processor] Error processing log entry:`, error);
    throw error;
  }
}

// Start processing logs for a data source
export function startLogstashProcessor(dataSourceId, config = {}) {
  // Stop existing processor if running
  stopLogstashProcessor(dataSourceId);
  
  const intervalMs = config.intervalMs || 2000; // Default: 1 log every 2 seconds
  const maxLogs = config.maxLogs || null; // null = unlimited
  
  let processedCount = 0;
  let currentRowNumber = 0; // Counter for row_number
  let rowNumberInitialized = false; // Flag to track if we've initialized row_number
  const featureWindow = []; // Sliding window for LSTM sequence
  
  console.log(`[Logstash Processor] Starting processor for data source ${dataSourceId} (interval: ${intervalMs}ms)`);
  
  // Get the max row_number for this data source to start counting from there
  const initializeRowNumber = async () => {
    if (rowNumberInitialized) return;
    try {
      const { data: maxRow } = await supabaseAdmin
        .from('processed_rows')
        .select('row_number')
        .eq('data_source_id', dataSourceId)
        .order('row_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (maxRow && maxRow.row_number) {
        currentRowNumber = maxRow.row_number;
        console.log(`[Logstash Processor] Starting from row_number ${currentRowNumber + 1}`);
      }
      rowNumberInitialized = true;
    } catch (error) {
      console.warn(`[Logstash Processor] Could not fetch max row_number, starting from 1:`, error.message);
      currentRowNumber = 0;
      rowNumberInitialized = true;
    }
  };
  
  // Initialize row number immediately
  initializeRowNumber();
  
  const intervalId = setInterval(async () => {
    // Ensure row number is initialized before processing
    if (!rowNumberInitialized) {
      await initializeRowNumber();
    }
    try {
      // Check if we should stop
      if (maxLogs && processedCount >= maxLogs) {
        console.log(`[Logstash Processor] Reached max logs (${maxLogs}), stopping processor`);
        stopLogstashProcessor(dataSourceId);
        return;
      }
      
      // Generate test log
      const log = generateTestLog();
      
      // Increment row number
      currentRowNumber++;
      
      // Process through AI model
      const result = await processLogEntry(log, dataSourceId, featureWindow, currentRowNumber);
      
      processedCount++;
      
      if (result.isAnomaly) {
        console.log(`[Logstash Processor] 🔴 Anomaly detected (#${processedCount}):`, {
          user: log.user_id,
          action: log.action,
          score: (result.anomalyScore * 100).toFixed(1) + '%',
        });
      } else {
        console.log(`[Logstash Processor] ✅ Normal log processed (#${processedCount}):`, {
          user: log.user_id,
          action: log.action,
          score: (result.anomalyScore * 100).toFixed(1) + '%',
        });
      }
    } catch (error) {
      console.error(`[Logstash Processor] Error in processing loop:`, error);
      // Decrement currentRowNumber on error so we don't skip numbers
      currentRowNumber--;
    }
  }, intervalMs);
  
  // Store processor info
  activeProcessors.set(dataSourceId, {
    intervalId,
    startTime: Date.now(),
    processedCount: 0,
  });
  
  return intervalId;
}

// Stop processing logs for a data source
export function stopLogstashProcessor(dataSourceId) {
  const processor = activeProcessors.get(dataSourceId);
  if (processor) {
    clearInterval(processor.intervalId);
    activeProcessors.delete(dataSourceId);
    console.log(`[Logstash Processor] Stopped processor for data source ${dataSourceId}`);
  }
}

// Check if processor is running
export function isProcessorRunning(dataSourceId) {
  return activeProcessors.has(dataSourceId);
}

