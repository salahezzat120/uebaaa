# Insider Threat Detection Model - Complete Implementation

## ✅ Status: Ready for Training

The insider threat detection model training notebook has been fully implemented and is ready to use in Google Colab.

## 📋 What's Included

### 1. **Complete Colab Notebook** (`INSIDER_THREAT_MODEL_TRAINING_COLAB.ipynb`)
   - ✅ Step-by-step training pipeline
   - ✅ CERT dataset download and extraction
   - ✅ Feature extraction using `colab_feature_extractor.py`
   - ✅ LSTM Autoencoder model architecture (7 timesteps × 20 features)
   - ✅ Model training with callbacks
   - ✅ Model evaluation and visualization
   - ✅ Model saving and metadata export

### 2. **Feature Extractor** (`colab_feature_extractor.py`)
   - ✅ Extracts 20 features from log data
   - ✅ Detects 6 key threat patterns:
     - Brute Force Attacks (Feature #12)
     - Location Hopping (Feature #13)
     - Off-Hours Privileged Access (Feature #14)
     - Data Exfiltration (Feature #16)
     - Privilege Escalation (Feature #19)
     - Unusual Resource Access (Feature #18)

### 3. **Documentation**
   - ✅ `COLAB_QUICK_START.md` - Quick start guide
   - ✅ `CERT_DATASET_DOWNLOAD_GUIDE.md` - Dataset download instructions
   - ✅ This file - Complete implementation summary

## 🚀 Quick Start

### Step 1: Open Notebook in Colab
1. Upload `INSIDER_THREAT_MODEL_TRAINING_COLAB.ipynb` to Google Colab
2. Enable GPU: **Runtime → Change Runtime Type → GPU (T4)**

### Step 2: Download Dataset
1. Go to: https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247/1
2. Download the dataset file (`.tar.bz2` format)

### Step 3: Run Notebook
1. Run cells sequentially (or use **Runtime → Run All**)
2. Upload `colab_feature_extractor.py` when prompted (Step 2)
3. Upload CERT dataset when prompted (Step 3)
4. Wait for training to complete (1-2 hours)

### Step 4: Download Model Files
After training completes, download:
- `insider_threat_model_cert.h5` - Trained model
- `feature_scaler.pkl` - Feature normalizer
- `model_metadata.json` - Model configuration

## 🏗️ Model Architecture

```
Input: (7 timesteps, 20 features)

Encoder:
├── LSTM(128) → return_sequences=True
├── Dropout(0.2)
└── LSTM(64) → return_sequences=False

Bottleneck:
└── Dense(32, relu)

Decoder:
├── RepeatVector(7)
├── LSTM(64) → return_sequences=True
├── Dropout(0.2)
├── LSTM(128) → return_sequences=True
└── TimeDistributed(Dense(20, linear))

Output: (7 timesteps, 20 features)
```

## 📊 Features Extracted

The model uses 20 features per timestep:

1. **Action Type** (0-5) - Login, logoff, file, email, http, device
2. **Status** (0-1) - Success/failed
3-6. **IP Segments** (0-1 each) - Normalized IP address parts
7. **Hour of Day** (0-1) - Normalized hour
8. **Day of Week** (0-1) - Normalized weekday
9. **User Hash** (0-1) - Normalized user identifier
10. **Resource Length** (0-1) - Normalized resource path length
11. **Average IP** (0-1) - Average of IP segments
12. **Failed Attempts** (0-1) - **BRUTE FORCE INDICATOR**
13. **Unique IPs** (0-1) - **LOCATION HOPPING INDICATOR**
14. **Off-Hours Flag** (0-1) - **OFF-HOURS INDICATOR**
15. **Privilege Level** (0-1) - User privilege level
16. **Data Size** (0-1) - **DATA EXFILTRATION INDICATOR**
17. **Resource Sensitivity** (0-1) - Sensitive resource flag
18. **Unusual Resource** (0-1) - **UNUSUAL RESOURCE ACCESS INDICATOR**
19. **Privilege Escalation** (0-1) - **PRIVILEGE ESCALATION INDICATOR**
20. **Time Since Last Activity** (0-1) - Time gap indicator

## 🎯 Threat Detection Capabilities

### 1. Brute Force Attacks
- **Detection:** Feature #12 (failed_attempts)
- **Threshold:** > 0.5 (5+ failed attempts in 10 minutes)
- **Status:** ✅ Implemented

### 2. Location Hopping
- **Detection:** Feature #13 (unique_ips)
- **Threshold:** > 0.6 (3+ unique IPs in 1 hour)
- **Status:** ✅ Implemented

### 3. Off-Hours Privileged Access
- **Detection:** Feature #14 (off_hours) + Feature #15 (privilege_level)
- **Threshold:** Off-hours + High privilege
- **Status:** ✅ Implemented

### 4. Data Exfiltration
- **Detection:** Feature #16 (data_size)
- **Threshold:** > 0.5 (unusual large transfers)
- **Status:** ✅ Implemented

### 5. Privilege Escalation
- **Detection:** Feature #19 (privilege_escalation)
- **Threshold:** Sudden jump in privilege
- **Status:** ✅ Implemented

### 6. Unusual Resource Access
- **Detection:** Feature #18 (unusual_resource)
- **Threshold:** Access to new sensitive resources
- **Status:** ✅ Implemented

## 📈 Expected Performance

Based on LSTM Autoencoder architecture:
- **Training Time:** 1-2 hours (with GPU)
- **Model Size:** ~2-5 MB
- **Inference Speed:** < 10ms per sequence (7 events)
- **Accuracy:** Depends on dataset quality and training duration

## 🔧 Integration with S-UEBA System

After training, integrate the model:

1. **Upload Model:**
   - Go to Models page
   - Click "Upload Model"
   - Select `insider_threat_model_cert.h5`
   - Set type: `insider_threat`
   - Set framework: `tensorflow`

2. **Configure:**
   - Input shape: `(7, 20)`
   - Use threshold from `model_metadata.json`
   - Enable model for anomaly detection

3. **Feature Extraction:**
   - Use `InsiderThreatFeatureExtractor` from `colab_feature_extractor.py`
   - Or use backend implementation in `backend-fastapi/insider_threat_detector.py`

## 📁 Files Structure

```
guardian-owl-main/
├── INSIDER_THREAT_MODEL_TRAINING_COLAB.ipynb  # Training notebook
├── colab_feature_extractor.py                 # Feature extractor
├── COLAB_QUICK_START.md                       # Quick start guide
├── CERT_DATASET_DOWNLOAD_GUIDE.md             # Dataset guide
├── INSIDER_THREAT_MODEL_COMPLETE.md           # This file
└── backend-fastapi/
    └── insider_threat_detector.py             # Backend integration
```

## ⚠️ Important Notes

1. **Dataset Format:** The CERT dataset format may vary. The notebook handles common formats (CSV, tab-separated).

2. **Memory:** For large datasets, the notebook processes up to 50k rows by default. Adjust `sample_size` in Step 7 if needed.

3. **GPU Recommended:** Training is significantly faster with GPU. Enable it in Colab settings.

4. **Model Compatibility:** The trained model is compatible with:
   - TensorFlow 2.x
   - Keras API
   - Backend FastAPI integration

5. **Feature Consistency:** Ensure the feature extractor used in training matches the one used in production.

## 🐛 Troubleshooting

### "Out of Memory" Error
- Reduce `sample_size` in Step 7
- Use Colab Pro (32GB RAM)
- Reduce batch size in Step 10

### "Module Not Found" Error
- Re-run Step 1 (installation)
- Restart runtime: **Runtime → Restart Runtime**

### "File Not Found" Error
- Verify dataset was uploaded and extracted
- Check file paths in Step 6

### Slow Training
- Enable GPU: **Runtime → Change Runtime Type → GPU**
- Reduce epochs or increase batch size
- Use Colab Pro for better GPU

## ✅ Next Steps

1. ✅ Notebook is ready - Open in Colab
2. ✅ Download CERT dataset
3. ✅ Run training notebook
4. ✅ Download trained model
5. ✅ Integrate with S-UEBA system
6. ✅ Test with real log data

---

**Model is ready for training! 🚀**

For questions or issues, refer to:
- `COLAB_QUICK_START.md` - Step-by-step instructions
- `CERT_DATASET_DOWNLOAD_GUIDE.md` - Dataset download help
- Notebook comments - Detailed explanations in each cell

