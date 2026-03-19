export interface CSVRow {
  user_id: string;
  timestamp: string;
  action: string;
  source_ip: string;
  resource: string;
  status: string;
  rowNumber: number;
}

export interface ProcessedRow extends CSVRow {
  anomalyScore: number;
  isAnomaly: boolean;
  processedAt: Date;
  features?: number[];
}

export interface ProcessingStats {
  totalRows: number;
  processedRows: number;
  anomaliesDetected: number;
  averageAnomalyScore: number;
  processingRate: number; // rows per second
}

export class CSVProcessor {
  private rows: CSVRow[] = [];
  private processedRows: ProcessedRow[] = [];
  private processing = false;
  private currentIndex = 0;
  private currentSpeed = 1; // rows per second
  private featureWindow: number[][] = []; // Sliding window for LSTM sequences (7 timesteps)
  private modelId?: string; // Optional model ID to use for inference
  private stats: ProcessingStats = {
    totalRows: 0,
    processedRows: 0,
    anomaliesDetected: 0,
    averageAnomalyScore: 0,
    processingRate: 0,
  };
  private callbacks: {
    onRowProcessed?: (row: ProcessedRow) => void;
    onStatsUpdate?: (stats: ProcessingStats) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  } = {};

  async loadCSV(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const headersLower = headers.map(h => h.toLowerCase());
          
          // Flexible column mapping - try exact match first, then case-insensitive, then common variations
          const columnMapping: Record<string, string> = {
            'user_id': '',
            'timestamp': '',
            'action': '',
            'source_ip': '',
            'resource': '',
            'status': '',
          };
          
          // Common column name variations
          const columnVariations: Record<string, string[]> = {
            'user_id': ['user_id', 'userid', 'user', 'user id', 'user-id', 'username', 'user_name', 'account', 'email', 'user_account'],
            'timestamp': ['timestamp', 'time', 'date', 'datetime', 'date_time', 'created_at', 'event_time', 'event_time', 'log_time'],
            'action': ['action', 'activity', 'event', 'event_type', 'event_type', 'operation', 'activity_type', 'type', 'event'],
            'source_ip': ['source_ip', 'sourceip', 'source ip', 'source-ip', 'ip', 'ip_address', 'ipaddress', 'src_ip', 'srcip', 'client_ip'],
            'resource': ['resource', 'target', 'destination', 'object', 'file', 'url', 'endpoint', 'uri', 'path'],
            'status': ['status', 'result', 'outcome', 'success', 'response', 'response_code', 'http_status', 'code', 'http_code'],
          };
          
          // Find matching columns (case-insensitive)
          for (const [requiredCol, variations] of Object.entries(columnVariations)) {
            let found = false;
            for (const variation of variations) {
              const exactIndex = headers.indexOf(variation);
              const lowerIndex = headersLower.indexOf(variation.toLowerCase());
              
              if (exactIndex !== -1) {
                columnMapping[requiredCol] = headers[exactIndex];
                found = true;
                break;
              } else if (lowerIndex !== -1) {
                columnMapping[requiredCol] = headers[lowerIndex];
                found = true;
                break;
              }
            }
            
            if (!found) {
              // Try partial matching (e.g., "user_id" matches "user_id" in "user_id_123")
              for (let i = 0; i < headers.length; i++) {
                const headerLower = headersLower[i];
                if (headerLower.includes(requiredCol.toLowerCase().replace('_', '')) || 
                    requiredCol.toLowerCase().replace('_', '').includes(headerLower)) {
                  columnMapping[requiredCol] = headers[i];
                  found = true;
                  break;
                }
              }
            }
          }
          
          // Check which required columns are missing (action and status are optional)
          const criticalHeaders = ['user_id', 'timestamp', 'source_ip', 'resource'];
          const missingCriticalHeaders = criticalHeaders.filter(h => !columnMapping[h]);
          
          if (missingCriticalHeaders.length > 0) {
            const foundHeaders = headers.join(', ');
            throw new Error(
              `Missing required columns: ${missingCriticalHeaders.join(', ')}\n` +
              `Found columns: ${foundHeaders}\n` +
              `Please ensure your CSV has columns matching: user_id (or account), timestamp (or time), source_ip (or IP), resource (or url)\n` +
              `(Case-insensitive matching is supported)`
            );
          }
          
          // Provide defaults for optional columns (action and status)
          if (!columnMapping['action']) {
            console.warn('⚠️ No "action" column found. Using default value "access"');
          }
          if (!columnMapping['status']) {
            console.warn('⚠️ No "status" column found. Using default value "success"');
          }

          const rows: CSVRow[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
              // Get values from mapped columns
              const user_id = columnMapping['user_id'] ? values[headers.indexOf(columnMapping['user_id'])] : '';
              const timestamp = columnMapping['timestamp'] ? values[headers.indexOf(columnMapping['timestamp'])] : '';
              const source_ip = columnMapping['source_ip'] ? values[headers.indexOf(columnMapping['source_ip'])] : '';
              const resource = columnMapping['resource'] ? values[headers.indexOf(columnMapping['resource'])] : '';
              
              // Get optional columns or use defaults
              let action = '';
              if (columnMapping['action']) {
                action = values[headers.indexOf(columnMapping['action'])] || '';
              } else {
                // Derive action from URL if possible
                const url = resource.toLowerCase();
                if (url.includes('login') || url.includes('auth')) {
                  action = 'login';
                } else if (url.includes('download') || url.includes('get')) {
                  action = 'download_file';
                } else if (url.includes('upload') || url.includes('post')) {
                  action = 'upload_file';
                } else if (url.includes('access') || url.includes('view')) {
                  action = 'access_file';
                } else {
                  action = 'access_file'; // Default action
                }
              }
              
              let status = '';
              if (columnMapping['status']) {
                status = values[headers.indexOf(columnMapping['status'])] || '';
              } else {
                status = 'success'; // Default status
              }
              
              const row: CSVRow = {
                user_id: user_id || '',
                timestamp: timestamp || '',
                action: action,
                source_ip: source_ip || '',
                resource: resource || '',
                status: status,
                rowNumber: i,
              };
              rows.push(row);
            }
          }

          this.rows = rows;
          this.stats.totalRows = rows.length;
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Feature extraction for model input
  private extractFeatures(row: CSVRow): number[] {
    // Convert categorical features to numerical
    const actionTypes: Record<string, number> = {
      'login': 0,
      'access_file': 1,
      'download_file': 2,
      'upload_file': 3,
      'admin_action': 4,
      'execute_script': 5,
    };

    const statusTypes: Record<string, number> = {
      'success': 1,
      'failed': 0,
    };

    // Extract IP address segments
    const ipParts = row.source_ip.split('.').map(Number).filter(n => !isNaN(n));
    const ip1 = ipParts[0] || 0;
    const ip2 = ipParts[1] || 0;
    const ip3 = ipParts[2] || 0;
    const ip4 = ipParts[3] || 0;

    // Extract hour from timestamp
    const hour = parseInt(row.timestamp.split(' ')[1]?.split(':')[0] || '0', 10);

    // User ID hash (simple hash for demo)
    const userIdHash = row.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

    // Resource path length
    const resourceLength = row.resource.length;

    // Extract 11 features to match model input (model expects [7, 11])
    return [
      actionTypes[row.action] || 0,
      statusTypes[row.status] || 0,
      ip1 / 255,
      ip2 / 255,
      ip3 / 255,
      ip4 / 255,
      hour / 24,
      userIdHash / 100,
      resourceLength / 100,
      // Add 2 more features for model compatibility
      (ip1 + ip2 + ip3 + ip4) / (255 * 4), // Average IP
      Math.min(1, resourceLength / 200), // Normalized resource length (alternative)
    ];
  }

  // Run model inference using ModelService
  private async runInference(features: number[]): Promise<{ anomalyScore: number; isAnomaly: boolean }> {
    // Add features to sliding window (model needs sequences of 7 timesteps)
    this.featureWindow.push(features);
    
    // Keep only last 7 timesteps
    if (this.featureWindow.length > 7) {
      this.featureWindow.shift();
    }
    
    // Need at least 7 timesteps for LSTM model, pad if needed
    let sequence: number[][];
    if (this.featureWindow.length < 7) {
      // Pad with first feature vector
      const padding = Array(7 - this.featureWindow.length).fill(this.featureWindow[0] || features);
      sequence = [...padding, ...this.featureWindow];
    } else {
      sequence = [...this.featureWindow];
    }
    
    // Import model service dynamically to avoid circular dependencies
    const { ModelService } = await import('./modelService');
    const modelService = new ModelService();
    
    try {
      // Pass the sequence (7 timesteps x 11 features) to the model
      // This calls the real model through FastAPI -> Node.js -> Frontend
      // Use all active models by default (ensemble prediction)
      const useAllActive = !this.modelId; // If no specific model ID, use all active models
      
      if (useAllActive) {
        console.log('📊 Using ensemble prediction with all active models from database');
      } else {
        console.log(`📊 Using specific model: ${this.modelId}`);
      }
      
      const prediction = await modelService.predict(sequence, this.modelId, useAllActive);
      
      // Log which models were actually used
      if (prediction.modelsUsed && prediction.modelsUsed.length > 0) {
        console.log(`✅ Prediction complete using ${prediction.modelsUsed.length} model(s):`, 
          prediction.modelsUsed.map(m => `${m.name} (${(m.weight * 100).toFixed(0)}%)`).join(', ')
        );
      }
      
      return {
        anomalyScore: prediction.anomalyScore,
        isAnomaly: prediction.isAnomaly,
      };
    } catch (error) {
      console.error('❌ Model inference error:', error);
      console.error('   All predictions MUST come from your real model.');
      console.error('   Please ensure FastAPI backend is running with model loaded.');
      // Re-throw error - don't use fallback, we want real model only
      throw new Error(`Real model inference failed: ${error.message}`);
    }
  }

  // Fallback inference if model is not available
  private fallbackInference(features: number[]): { anomalyScore: number; isAnomaly: boolean } {
    // Features are normalized: [action, status, ip1/255, ip2/255, ip3/255, ip4/255, hour/24, userIdHash/100, resourceLength/100, ...]
    const [action, status, ip1Norm, ip2Norm, ip3Norm, ip4Norm, hourNorm, userIdHashNorm, resourceLengthNorm] = features;
    
    // Denormalize values for detection logic
    const ip1 = ip1Norm * 255;
    const hour = hourNorm * 24;
    
    // Check for normal business activity first
    const isNormalBusinessHours = hour >= 9 && hour <= 17;
    const isInternalIP = ip1 >= 192 && ip1 <= 192;
    const isNormalAction = action >= 0 && action <= 3;
    const isSuccess = status === 1;
    
    // Normal pattern: business hours + internal IP + normal action + success
    if (isNormalBusinessHours && isInternalIP && isSuccess && isNormalAction) {
      const anomalyScore = 0.3 + (Math.random() * 0.15); // 30-45% for normal activity
      return { anomalyScore: Math.min(1, anomalyScore), isAnomaly: false };
    }
    
    // Admin actions during business hours from internal IP
    if (action === 4 && isNormalBusinessHours && isInternalIP && isSuccess) {
      const anomalyScore = 0.45 + (Math.random() * 0.1); // 45-55% for normal admin activity
      return { anomalyScore: Math.min(1, anomalyScore), isAnomaly: false };
    }
    
    // Start with base score for other activities
    let anomalyScore = 0.35;
    
    // Failed logins significantly increase anomaly score
    if (status === 0) {
      anomalyScore += 0.35; // Strong indicator
    }
    
    // Admin actions outside normal context
    if (action === 4) {
      if (!isNormalBusinessHours || !isInternalIP) {
        anomalyScore += 0.2; // Admin action in unusual context
      }
    }
    
    // Script execution is always highly suspicious
    if (action === 5) {
      anomalyScore += 0.4;
    }
    
    // External IPs combined with suspicious activity
    if (ip1 > 192 || ip1 < 10) {
      if (status === 0 || action === 5) {
        anomalyScore += 0.3; // External IP + failed login or script
      } else {
        anomalyScore += 0.2; // External IP alone
      }
    }
    
    // Off-hours activity
    if (hour < 6 || hour >= 23) {
      anomalyScore += 0.25; // Very off-hours
    } else if (hour < 8 || hour > 20) {
      anomalyScore += 0.15; // Slightly unusual hours
    }
    
    // Long resource paths (potential path traversal) - resourceLengthNorm is normalized 0-1
    if (resourceLengthNorm > 0.7) {
      anomalyScore += 0.15;
    }
    
    // Add some randomness for realism
    anomalyScore += (Math.random() - 0.5) * 0.05;
    anomalyScore = Math.max(0, Math.min(1, anomalyScore));
    
    const isAnomaly = anomalyScore > 0.7; // Threshold at 70%
    
    return { anomalyScore, isAnomaly };
  }

  async processRow(row: CSVRow): Promise<ProcessedRow> {
    const features = this.extractFeatures(row);
    const { anomalyScore, isAnomaly } = await this.runInference(features);
    
    const processedRow: ProcessedRow = {
      ...row,
      anomalyScore,
      isAnomaly,
      processedAt: new Date(),
      features,
    };

    this.processedRows.push(processedRow);
    
    // Update stats
    this.stats.processedRows++;
    if (isAnomaly) {
      this.stats.anomaliesDetected++;
    }
    
    const totalScore = this.processedRows.reduce((sum, r) => sum + r.anomalyScore, 0);
    this.stats.averageAnomalyScore = totalScore / this.processedRows.length;

    return processedRow;
  }

  async startProcessing(rowsPerSecond: number = 1): Promise<void> {
    if (this.processing) {
      // If already processing, just update the speed
      this.currentSpeed = rowsPerSecond;
      this.stats.processingRate = rowsPerSecond;
      if (this.callbacks.onStatsUpdate) {
        this.callbacks.onStatsUpdate({ ...this.stats });
      }
      return;
    }

    if (this.rows.length === 0) {
      throw new Error('No rows loaded. Call loadCSV first.');
    }

    this.processing = true;
    this.currentSpeed = rowsPerSecond;
    // Don't reset currentIndex if resuming from pause
    if (this.currentIndex >= this.rows.length) {
      this.currentIndex = 0;
      this.processedRows = [];
    }
    
    // Initialize stats if not already set
    if (!this.stats || this.stats.totalRows === 0) {
      this.stats = {
        totalRows: this.rows.length,
        processedRows: this.processedRows.length,
        anomaliesDetected: this.processedRows.filter(r => r.isAnomaly).length,
        averageAnomalyScore: this.processedRows.length > 0
          ? this.processedRows.reduce((sum, r) => sum + r.anomalyScore, 0) / this.processedRows.length
          : 0,
        processingRate: rowsPerSecond,
      };
    } else {
      // Update processing rate
      this.stats.processingRate = rowsPerSecond;
    }

    const delay = 1000 / this.currentSpeed; // milliseconds between rows

    // Use recursive setTimeout pattern to allow processing to continue until stopped
    const processNext = async () => {
      // Check if processing was stopped or all rows are done
      if (!this.processing) {
        // Processing was stopped manually
        return;
      }

      if (this.currentIndex >= this.rows.length) {
        // All rows processed - complete
        this.processing = false;
        if (this.callbacks.onComplete) {
          this.callbacks.onComplete();
        }
        return;
      }

      try {
        const row = this.rows[this.currentIndex];
        const processedRow = await this.processRow(row);
        
        if (this.callbacks.onRowProcessed) {
          this.callbacks.onRowProcessed(processedRow);
        }
        
        if (this.callbacks.onStatsUpdate) {
          this.callbacks.onStatsUpdate({ ...this.stats });
        }

        this.currentIndex++;
        
        // Continue to next row automatically after delay
        // Use current speed (which may have changed)
        const currentDelay = 1000 / this.currentSpeed;
        if (this.processing && this.currentIndex < this.rows.length) {
          setTimeout(processNext, currentDelay);
        } else if (this.currentIndex >= this.rows.length) {
          // Finished all rows
          this.processing = false;
          if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
          }
        }
      } catch (error) {
        this.processing = false;
        if (this.callbacks.onError) {
          this.callbacks.onError(error as Error);
        }
      }
    };

    // Start processing immediately
    processNext();
  }

  stopProcessing() {
    if (this.processing) {
      this.processing = false;
      console.log('Processing stopped by user');
    }
  }

  updateProcessingSpeed(rowsPerSecond: number): void {
    this.currentSpeed = rowsPerSecond;
    this.stats.processingRate = rowsPerSecond;
    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate({ ...this.stats });
    }
    console.log(`Processing speed updated to ${rowsPerSecond} rows/second`);
  }

  // Set the model ID to use for predictions
  setModelId(modelId?: string): void {
    this.modelId = modelId;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  setCallbacks(callbacks: {
    onRowProcessed?: (row: ProcessedRow) => void;
    onStatsUpdate?: (stats: ProcessingStats) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }) {
    this.callbacks = callbacks;
  }

  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  getProcessedRows(): ProcessedRow[] {
    return [...this.processedRows];
  }

  reset() {
    this.rows = [];
    this.processedRows = [];
    this.processing = false;
    this.currentIndex = 0;
    this.currentSpeed = 1;
    this.featureWindow = [];
    this.stats = {
      totalRows: 0,
      processedRows: 0,
      anomaliesDetected: 0,
      averageAnomalyScore: 0,
      processingRate: 0,
    };
  }
}
