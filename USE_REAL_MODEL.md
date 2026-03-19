# Using Your Real LSTM Autoencoder Model

## ✅ Model Setup Complete!

Your model is now configured to use the **actual LSTM Autoencoder** (`lstm_ae_cert.h5`) that you trained!

## What Changed

1. **Model Service Updated**: Changed `useBackendAPI = false` to use TensorFlow.js model directly
2. **Real Model Loading**: The system now loads `public/models/model.json` (your converted model)
3. **Real Inference**: Uses your model's actual predictions instead of simulation

## How It Works

1. **CSV Upload**: When you upload a CSV file, each row is processed
2. **Feature Extraction**: CSV data is converted to numerical features (11 features per row)
3. **Sequence Building**: Features are grouped into sequences of 7 timesteps (for LSTM)
4. **Model Inference**: Your LSTM Autoencoder processes the sequence
5. **Reconstruction Error**: Model calculates how well it can reconstruct the input
6. **Anomaly Score**: Higher reconstruction error = higher anomaly score
7. **Result**: Displayed in the UI with Anomaly Score and Result (Normal/Anomaly)

## Model Input/Output

- **Input Shape**: `[1, 7, 11]` (1 batch, 7 timesteps, 11 features)
- **Output**: Reconstructed sequence (same shape as input)
- **Reconstruction Error**: Mean Squared Error (MSE) between input and output
- **Anomaly Score**: Mapped from reconstruction error (0-100%)

## Anomaly Detection Logic

Your model's reconstruction error is mapped to anomaly scores:

- **0-0.01 error** → 20-40% score (Normal)
- **0.01-0.05 error** → 40-60% score (Mostly Normal)
- **0.05-0.15 error** → 60-80% score (Suspicious)
- **0.15+ error** → 80-100% score (Anomaly)

**Threshold**: Scores > 70% are flagged as "Anomaly"

## Testing

1. **Upload CSV**: Go to Data Sources page
2. **Select File**: Choose `test-anomaly-detection.csv` or your own CSV
3. **Watch Processing**: See real-time predictions from your model
4. **Check Results**: View Anomaly Score and Result for each row

## Troubleshooting

### Model Not Loading?

Check browser console for errors:
- `model.json` should be in `public/models/`
- Weight files (`group1-shard*.bin`) should be in same folder
- Check network tab for 404 errors

### Wrong Predictions?

- Your model was trained on specific data patterns
- Adjust thresholds in `modelService.ts` if needed
- Check that feature extraction matches your training data format

### Performance Issues?

- Model runs in browser (CPU)
- For better performance, use backend API (`useBackendAPI = true`)
- Or use GPU-accelerated TensorFlow.js

## Next Steps

1. **Test with your CSV**: Upload and see real predictions
2. **Adjust Thresholds**: Modify anomaly score mapping if needed
3. **Fine-tune**: Update reconstruction error thresholds based on your model's behavior

## Model Files

- ✅ `public/models/model.json` - Model architecture
- ✅ `public/models/group1-shard1of1.bin` - Model weights
- ✅ `models/lstm_ae_cert.h5` - Original Keras model (source)

Your model is ready to use! 🚀





