# Quick Start Guide: Training Insider Threat Model in Google Colab

## Prerequisites

1. **Google Colab Pro** (recommended for better performance)
2. **CERT Dataset** downloaded from KiltHub
3. **Feature Extractor File** (`colab_feature_extractor.py`)

## Step-by-Step Instructions

### 1. Open the Colab Notebook

1. Upload `INSIDER_THREAT_MODEL_TRAINING_COLAB.ipynb` to Google Colab
2. Or create a new notebook and copy the cells

### 2. Download CERT Dataset

**Option A: Upload from Local Machine (Easiest)**
1. Download CERT dataset from: https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247/1
2. In Colab, run the upload cell (Step 2)
3. Select the `.tar.bz2` file from your computer
4. Wait for upload to complete

**Option B: Use Google Drive**
1. Upload dataset to Google Drive
2. Mount Drive in Colab: `drive.mount('/content/drive')`
3. Copy file: `!cp "/content/drive/MyDrive/cert_dataset.tar.bz2" /content/`

### 3. Upload Feature Extractor

1. In Step 1, you'll be prompted to upload `colab_feature_extractor.py`
2. This file is already created in your project root
3. Upload it when prompted

### 4. Run All Cells

1. Click **Runtime → Run All** or run cells sequentially
2. The notebook will:
   - Install dependencies
   - Extract dataset
   - Load and explore data
   - Extract features
   - Train the model
   - Evaluate performance
   - Save model files

### 5. Download Model Files

After training completes, you'll get 3 files:
- `insider_threat_model_cert.h5` - The trained model
- `model_metadata.json` - Model configuration
- `feature_scaler.pkl` - Feature normalizer

## Expected Timeline

- **Dataset Upload:** 5-15 minutes (depending on connection)
- **Feature Extraction:** 10-30 minutes (depending on dataset size)
- **Model Training:** 1-2 hours (on GPU)
- **Total Time:** ~2-3 hours

## Troubleshooting

### "Out of Memory" Error
- Use Colab Pro (32GB RAM)
- Reduce batch size in training cell
- Process data in smaller chunks

### "File Not Found" Error
- Check dataset extraction path
- Verify CSV files exist in `/content/extracted/`
- Look for files recursively: `!find /content/extracted -name "*.csv"`

### "Module Not Found" Error
- Re-run the pip install cell
- Restart runtime: **Runtime → Restart Runtime**

### Slow Training
- Enable GPU: **Runtime → Change Runtime Type → GPU (T4)**
- Reduce epochs or increase batch size
- Use Colab Pro for better GPU

## Model Integration

After downloading the model:

1. **Upload to S-UEBA System:**
   - Go to Models page
   - Click "Upload Model"
   - Select `insider_threat_model_cert.h5`
   - Set model type: `insider_threat`
   - Set framework: `tensorflow`

2. **Configure Model:**
   - Use values from `model_metadata.json`
   - Set anomaly threshold from metadata
   - Enable the model

3. **Test the Model:**
   - Upload test CSV data
   - Verify anomaly detection works
   - Check detection patterns match expectations

## What the Model Detects

✅ **Brute Force Attacks** - Multiple failed logins  
✅ **Location Hopping** - Rapid IP changes  
✅ **Off-Hours Privileged Access** - Admin actions at unusual times  
✅ **Data Exfiltration** - Large data transfers  
✅ **Privilege Escalation** - Sudden privilege increases  
✅ **Unusual Resource Access** - Access to new sensitive resources  

## Support

If you encounter issues:
1. Check the notebook error messages
2. Review `CERT_DATASET_DOWNLOAD_GUIDE.md`
3. Verify dataset format matches expected structure
4. Check Colab runtime logs

---

**Ready to start?** Open the notebook and follow the cells step by step! 🚀



