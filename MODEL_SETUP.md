# Model Integration Guide

## Converting Your LSTM Autoencoder Model to TensorFlow.js

To use your trained `lstm_ae_cert.h5` model in the browser, you need to convert it to TensorFlow.js format.

### Step 1: Install TensorFlow.js Converter

```bash
pip install tensorflowjs
```

### Step 2: Convert the Model

```bash
tensorflowjs_converter --input_format keras models/lstm_ae_cert.h5 public/models/
```

This will create:
- `public/models/model.json` - Model architecture
- `public/models/group1-shard*.bin` - Model weights

### Step 3: Update Model Path

Update `src/services/modelService.ts`:

```typescript
private modelPath = '/models/model.json'; // Update this path
```

### Step 4: Install TensorFlow.js in Your Project

```bash
npm install @tensorflow/tfjs
```

### Step 5: Update ModelService to Load Real Model

Replace the `loadModel()` method in `src/services/modelService.ts`:

```typescript
import * as tf from '@tensorflow/tfjs';

async loadModel(): Promise<void> {
  try {
    this.model = await tf.loadLayersModel(this.modelPath);
    this.modelLoaded = true;
    console.log('LSTM Autoencoder model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
    throw error;
  }
}
```

### Step 6: Update Predict Method

Replace the `predict()` method:

```typescript
async predict(features: number[]): Promise<ModelPrediction> {
  if (!this.modelLoaded || !this.model) {
    await this.loadModel();
  }

  // Prepare input tensor
  // Adjust shape based on your model's expected input
  // LSTM models typically expect [batch, timesteps, features]
  // For single row, you might need: [1, 1, features.length]
  const input = tf.tensor3d([features], [1, 1, features.length]);
  
  // Run inference
  const output = this.model.predict(input) as tf.Tensor;
  const reconstructionError = await output.data();
  
  // LSTM Autoencoder outputs reconstruction error
  // Higher error = more anomalous
  const error = reconstructionError[0];
  const anomalyScore = Math.min(1, error / 0.5); // Normalize (adjust threshold as needed)
  const isAnomaly = anomalyScore > 0.6; // Adjust threshold based on your model
  
  input.dispose();
  output.dispose();

  return {
    anomalyScore,
    isAnomaly,
    reconstructionError: error,
    confidence: Math.abs(anomalyScore - 0.5) * 2,
  };
}
```

### Important Notes:

1. **Input Shape**: LSTM models expect sequences. You may need to:
   - Use a sliding window of previous rows
   - Pad or reshape features to match your model's training input
   - Adjust the tensor shape based on your model architecture

2. **Feature Engineering**: Ensure the feature extraction in `csvProcessor.ts` matches what your model was trained on.

3. **Threshold Tuning**: Adjust the anomaly threshold (0.6) based on your model's performance.

4. **Memory Management**: Always dispose of tensors after use to prevent memory leaks.

## Current Implementation

The current implementation uses simulated inference that mimics LSTM Autoencoder behavior. Once you convert your model, the system will automatically use the real model instead of the simulation.

## Testing

1. Upload a CSV file
2. Click "Start Processing"
3. Watch rows process in real-time with anomaly scores
4. Anomalies are highlighted in red

The system will fall back to rule-based detection if the model fails to load, ensuring the system always works.





