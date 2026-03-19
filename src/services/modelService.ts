// Model service for loading and running TensorFlow.js models
// This will be used to load the converted LSTM Autoencoder model

export interface ModelPrediction {
  anomalyScore: number;
  isAnomaly: boolean;
  reconstructionError?: number;
  confidence?: number;
}

export class ModelService {
  private model: any = null; // TensorFlow.js model
  private modelLoaded = false;
  private modelPath = '/models/model.json'; // Converted model path
  private apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/ai/predict`; // Node.js backend proxies to FastAPI
  private useBackendAPI = true; // Use backend API (RECOMMENDED - avoids TensorFlow.js conversion issues)

  async loadModel(): Promise<void> {
    // Option 1: Use backend API (if enabled)
    if (this.useBackendAPI) {
      this.modelLoaded = true;
      console.log('Model service initialized (using backend API)');
      return;
    }

    // Option 2: Load TensorFlow.js model directly (PREFERRED - uses your actual model)
    try {
      const tf = await import('@tensorflow/tfjs');
      console.log('🔄 Loading your LSTM Autoencoder model from:', this.modelPath);
      
      // Try to load the model
      this.model = await tf.loadLayersModel(this.modelPath);
      
      // Verify model loaded correctly
      if (!this.model || !this.model.inputs || this.model.inputs.length === 0) {
        throw new Error('Model loaded but has no inputs');
      }
      
      this.modelLoaded = true;
      console.log('✅ TensorFlow.js model loaded successfully!');
      console.log('📊 Model input shape:', this.model.inputs[0].shape);
      console.log('📊 Model output shape:', this.model.outputs[0].shape);
      return;
    } catch (error) {
      console.error('❌ TensorFlow.js model failed to load:', error);
      console.warn('⚠️ Model conversion issue detected - the model.json is missing input shape information');
      console.warn('⚠️ Falling back to simulated inference');
      console.log('💡 To use your real model, you have two options:');
      console.log('   Option 1: Fix the model conversion (re-convert with proper input shape)');
      console.log('   Option 2: Use backend API (set useBackendAPI = true)');
      console.log('   Option 3: Continue with simulation (current behavior)');
    }

    // Option 3: Fallback to simulated inference (only if model loading fails)
    this.modelLoaded = true;
    console.log('⚠️ Model service initialized (using simulated inference fallback)');
  }

  async predict(features: number[] | number[][], modelId?: string, useAllActive: boolean = true): Promise<ModelPrediction & { modelsUsed?: Array<{ id: string; name: string; weight: number }>; modelName?: string }> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    // Normalize features - handle both single vector and sequence
    const isSequence = Array.isArray(features[0]);
    const featureArray = isSequence ? features as number[][] : [features as number[]];
    
    // Option 1: Use backend API
    if (this.useBackendAPI) {
      try {
        const requestBody: any = { features: featureArray };
        if (useAllActive) {
          // Use ensemble prediction with all active models
          requestBody.useAllActive = true;
          console.log('🔍 Requesting ensemble prediction with all active models...');
        } else if (modelId) {
          // Use specific model
          requestBody.modelId = modelId;
          console.log(`🔍 Requesting prediction from specific model: ${modelId}`);
        } else {
          console.log('🔍 Requesting prediction (default model)');
        }
        
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response has required fields
        if (typeof data.anomalyScore === 'undefined' || typeof data.isAnomaly === 'undefined') {
          throw new Error('Invalid API response: missing anomalyScore or isAnomaly');
        }
        
        // Log which models were used
        if (data.modelsUsed && data.modelsUsed.length > 0) {
          console.log(`✅ Ensemble prediction from ${data.modelsUsed.length} active model(s):`, 
            data.modelsUsed.map((m: any) => `${m.name} (${(m.weight * 100).toFixed(0)}%)`).join(', ')
          );
        } else if (data.modelName) {
          console.log(`✅ Single model prediction from: ${data.modelName}`);
        } else {
          console.log('✅ Prediction received (default model)');
        }
        
        console.log('   Result:', {
          anomalyScore: data.anomalyScore,
          isAnomaly: data.isAnomaly,
          reconstructionError: data.reconstructionError
        });
        
        return {
          anomalyScore: data.anomalyScore,
          isAnomaly: data.isAnomaly,
          reconstructionError: data.reconstructionError,
          confidence: data.confidence || Math.abs(data.anomalyScore - 0.5) * 2,
          modelsUsed: data.modelsUsed,
          modelName: data.modelName,
          modelCount: data.modelCount,
        };
      } catch (error) {
        console.error('❌ Backend API error - model inference failed:', error);
        console.error('   This should not happen. Check:');
        console.error('   1. FastAPI is running on port 5000');
        console.error('   2. Node.js backend is running on port 3000');
        console.error('   3. Model is loaded in FastAPI');
        // Throw error instead of falling back to simulation
        throw new Error(`Model inference failed: ${error.message}. Please ensure all services are running.`);
      }
    }

    // Option 2: Use TensorFlow.js model (YOUR ACTUAL MODEL)
    if (this.model) {
      try {
        const tf = await import('@tensorflow/tfjs');
        
        // Ensure we have the right sequence length (7 timesteps for LSTM)
        // Pad or truncate to match model's expected input shape
        let sequence = featureArray;
        const expectedTimesteps = 7;
        const expectedFeatures = featureArray[0]?.length || 11;
        
        // Pad sequence if too short
        if (sequence.length < expectedTimesteps) {
          const padding = Array(expectedTimesteps - sequence.length).fill(sequence[0] || new Array(expectedFeatures).fill(0));
          sequence = [...padding, ...sequence];
        }
        // Truncate if too long
        if (sequence.length > expectedTimesteps) {
          sequence = sequence.slice(-expectedTimesteps);
        }
        
        // Model expects shape [batch, timesteps, features] = [1, 7, 11]
        const input = tf.tensor3d([sequence], [1, expectedTimesteps, expectedFeatures]);
        
        // Run inference with your actual model
        const output = this.model.predict(input) as any;
        const reconstructed = await output.data();
        const inputData = await input.data();
        
        // Calculate reconstruction error (MSE between input and reconstructed output)
        // This is what your LSTM Autoencoder does - it tries to reconstruct the input
        let mse = 0;
        const dataLength = Math.min(inputData.length, reconstructed.length);
        for (let i = 0; i < dataLength; i++) {
          mse += Math.pow(inputData[i] - reconstructed[i], 2);
        }
        mse = mse / dataLength;
        
        // Convert reconstruction error to anomaly score
        // Higher reconstruction error = more anomalous
        // Normalize based on your model's typical error range
        const reconstructionError = mse;
        
        // Map reconstruction error to anomaly score (0-1)
        // Adjust these thresholds based on your model's behavior
        let anomalyScore: number;
        if (reconstructionError <= 0.01) {
          // Very low error = normal behavior
          anomalyScore = 0.2 + (reconstructionError / 0.01) * 0.2; // 20-40%
        } else if (reconstructionError <= 0.05) {
          // Low error = mostly normal
          anomalyScore = 0.4 + ((reconstructionError - 0.01) / 0.04) * 0.2; // 40-60%
        } else if (reconstructionError <= 0.15) {
          // Medium error = suspicious
          anomalyScore = 0.6 + ((reconstructionError - 0.05) / 0.1) * 0.2; // 60-80%
        } else {
          // High error = anomaly
          anomalyScore = 0.8 + Math.min(0.2, (reconstructionError - 0.15) / 0.5); // 80-100%
        }
        
        anomalyScore = Math.max(0, Math.min(1, anomalyScore));
        const isAnomaly = anomalyScore > 0.7; // Threshold at 70%
        
        // Clean up tensors to free memory
        input.dispose();
        output.dispose();
        
        console.log(`🤖 Model prediction: error=${reconstructionError.toFixed(4)}, score=${(anomalyScore*100).toFixed(1)}%, anomaly=${isAnomaly}`);
        
        return {
          anomalyScore,
          isAnomaly,
          reconstructionError,
          confidence: Math.abs(anomalyScore - 0.5) * 2,
        };
      } catch (error) {
        console.error('❌ TensorFlow.js inference error:', error);
        console.warn('⚠️ Falling back to simulated inference');
        // Fall through to simulation
      }
    }

    // Option 3: Simulated inference (fallback)
    const lastFeatures = isSequence ? featureArray[featureArray.length - 1] : features as number[];
    const reconstructionError = this.simulateReconstructionError(lastFeatures, isSequence ? featureArray : undefined);
    
    // Normalize reconstruction error to anomaly score (0-1 scale)
    // Map reconstruction error to meaningful anomaly scores:
    // 0.0-0.1 (very normal) -> 20-40% score
    // 0.1-0.25 (normal) -> 40-60% score
    // 0.25-0.5 (suspicious) -> 60-80% score
    // 0.5-1.0 (anomaly) -> 80-100% score
    let anomalyScore: number;
    if (reconstructionError <= 0.1) {
      // Very normal: map 0-0.1 to 20-40%
      anomalyScore = 0.2 + (reconstructionError / 0.1) * 0.2;
    } else if (reconstructionError <= 0.25) {
      // Normal: map 0.1-0.25 to 40-60%
      anomalyScore = 0.4 + ((reconstructionError - 0.1) / 0.15) * 0.2;
    } else if (reconstructionError <= 0.5) {
      // Suspicious: map 0.25-0.5 to 60-80%
      anomalyScore = 0.6 + ((reconstructionError - 0.25) / 0.25) * 0.2;
    } else {
      // Anomaly: map 0.5-1.0 to 80-100%
      anomalyScore = 0.8 + ((reconstructionError - 0.5) / 0.5) * 0.2;
    }
    
    anomalyScore = Math.max(0, Math.min(1, anomalyScore));
    const isAnomaly = anomalyScore > 0.7; // Threshold at 70%
    const confidence = Math.abs(anomalyScore - 0.5) * 2;

    return {
      anomalyScore,
      isAnomaly,
      reconstructionError,
      confidence,
    };
  }

  private simulateReconstructionError(features: number[], sequence?: number[][]): number {
    // Simulate reconstruction error based on feature patterns
    // This mimics what an LSTM Autoencoder would output
    
    // Features are normalized: [action, status, ip1/255, ip2/255, ip3/255, ip4/255, hour/24, userIdHash/100, resourceLength/100, ...]
    const [action, status, ip1Norm, ip2Norm, ip3Norm, ip4Norm, hourNorm, userIdHashNorm, resourceLengthNorm] = features;
    
    // Denormalize values for detection logic
    const ip1 = ip1Norm * 255;
    const hour = hourNorm * 24;
    
    // Start with a base error that represents normal behavior
    // Normal activities should have low reconstruction error (0.1-0.2)
    let error = 0.12; // Base reconstruction error for normal patterns
    
    // Check if this is clearly normal behavior first
    const isNormalBusinessHours = hour >= 9 && hour <= 17;
    const isInternalIP = ip1 >= 192 && ip1 <= 192;
    const isNormalAction = action >= 0 && action <= 3; // login, access_file, download_file, upload_file
    const isSuccess = status === 1;
    
    // Normal pattern: business hours + internal IP + normal action + success
    if (isNormalBusinessHours && isInternalIP && isSuccess && isNormalAction) {
      // This is normal - keep error very low
      error = 0.05 + (Math.random() * 0.05); // 5-10% error -> maps to 20-35% score
      return Math.max(0, Math.min(1, error));
    }
    
    // Admin actions during business hours from internal IP are normal
    if (action === 4 && isNormalBusinessHours && isInternalIP && isSuccess) {
      error = 0.08 + (Math.random() * 0.06); // 8-14% error -> maps to 35-50% score
      return Math.max(0, Math.min(1, error));
    }
    
    // Failed logins are much harder to reconstruct (strong anomaly indicator)
    if (status === 0) {
      error += 0.4; // Strong indicator of anomaly
    }
    
    // Execute script is always highly suspicious
    if (action === 5) {
      error += 0.35; // Script execution is highly anomalous
    }
    
    // Admin actions outside business hours or from external IP
    if (action === 4) {
      if (!isNormalBusinessHours || !isInternalIP) {
        error += 0.25; // Admin action in unusual context
      }
    }
    
    // External IPs (unusual patterns)
    if (ip1 > 192 || ip1 < 10) {
      if (status === 0 || action === 5) {
        error += 0.3; // External IP + failed login or script execution
      } else {
        error += 0.2; // External IP alone
      }
    }
    
    // Off-hours activity (very early morning or late night)
    if (hour < 6 || hour >= 23) {
      error += 0.25; // Very off-hours
    } else if (hour < 8 || hour > 20) {
      error += 0.15; // Slightly unusual hours
    }
    
    // Check sequence context if available
    if (sequence && sequence.length >= 2) {
      // Multiple failed logins in sequence (brute force)
      const recentFailures = sequence.slice(-5).filter(s => s[1] === 0).length;
      if (recentFailures >= 3) {
        error += 0.35; // Brute force pattern
      }
      
      // Rapid action changes (potential attack pattern)
      const recentActions = sequence.slice(-3).map(s => s[0]);
      const uniqueActions = new Set(recentActions).size;
      if (uniqueActions === 3 && recentActions.includes(5)) {
        error += 0.25; // Rapid escalation to script execution
      }
    }
    
    // Long resource paths (potential path traversal) - resourceLength is normalized 0-1
    if (resourceLengthNorm > 0.7) {
      error += 0.2;
    }
    
    // Add small amount of noise
    error += (Math.random() - 0.5) * 0.05;
    
    // Clamp and ensure we don't go too high for normal patterns
    return Math.max(0, Math.min(1, error));
  }

  isModelLoaded(): boolean {
    return this.modelLoaded;
  }

  // Instructions for converting H5 to TensorFlow.js:
  // 1. Install: pip install tensorflowjs
  // 2. Convert: tensorflowjs_converter --input_format keras models/lstm_ae_cert.h5 public/models/
  // 3. This creates model.json and weight files
  // 4. Update modelPath to point to the converted model
}
