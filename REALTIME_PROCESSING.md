# Real-Time CSV Processing with Anomaly Detection

## Overview

The system now processes CSV files row-by-row in real-time, running each row through your LSTM Autoencoder model to detect anomalies.

## How It Works

1. **Upload CSV**: Upload a CSV file with security log data
2. **Start Processing**: Click "Start Processing" to begin row-by-row analysis
3. **Real-Time Updates**: Watch as each row is processed with:
   - Anomaly score (0-100%)
   - Anomaly detection result (Normal/Anomaly)
   - Live statistics
4. **Results**: See all processed rows in a table with color-coded anomaly indicators

## Features

- ✅ **Row-by-row processing** - Processes one row per second (adjustable)
- ✅ **Anomaly detection** - Uses LSTM Autoencoder model for detection
- ✅ **Real-time updates** - See results as they're processed
- ✅ **Live statistics** - Total anomalies, average score, processing rate
- ✅ **Visual indicators** - Color-coded scores and badges
- ✅ **Pause/Resume** - Control processing flow
- ✅ **Auto-scroll** - Automatically scrolls to latest results

## Using Your Trained Model

### Quick Start (Simulated Mode)

The system currently uses simulated inference that mimics LSTM Autoencoder behavior. This works immediately without any setup.

### Using Your Real Model

To use your actual `lstm_ae_cert.h5` model:

1. **Convert Model to TensorFlow.js**:
   ```bash
   pip install tensorflowjs
   tensorflowjs_converter --input_format keras models/lstm_ae_cert.h5 public/models/
   ```

2. **Install TensorFlow.js**:
   ```bash
   npm install @tensorflow/tfjs
   ```

3. **Update ModelService**: Follow instructions in `MODEL_SETUP.md`

## CSV Format

Your CSV must have these columns:
- `user_id` - User identifier (email or username)
- `timestamp` - Timestamp in format: `YYYY-MM-DD HH:MM:SS`
- `action` - Action type (login, access_file, download_file, etc.)
- `source_ip` - Source IP address
- `resource` - Resource path or identifier
- `status` - Status (success or failed)

Example:
```csv
user_id,timestamp,action,source_ip,resource,status
john.doe@company.com,2024-01-15 08:32:15,login,192.168.1.100,/api/dashboard,success
```

## Processing Speed

- Default: 1 row per second
- Adjustable: 0.5 to 5 rows per second
- Use the slider in the processing controls

## Anomaly Scoring

- **0-50%**: Normal behavior (green)
- **50-70%**: Medium risk (orange)
- **70-100%**: High risk / Anomaly (red)

## Output

Each processed row shows:
- Row number
- User ID
- Action type
- Source IP
- Status
- Anomaly score (visual bar + percentage)
- Result badge (Normal/Anomaly)

## Test Data

Use the provided `public/test-data-sample.csv` file to test the system. It contains 100 rows of realistic security log data.

## Troubleshooting

- **Model not loading**: System falls back to rule-based detection
- **Slow processing**: Reduce rows per second in settings
- **Memory issues**: Process smaller CSV files or increase browser memory
- **No results**: Check CSV format matches expected columns

## Next Steps

1. Test with the sample CSV file
2. Convert your model to TensorFlow.js format
3. Adjust anomaly thresholds based on your model's performance
4. Fine-tune feature extraction to match your training data





