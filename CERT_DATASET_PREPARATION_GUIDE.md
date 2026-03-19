# CERT Dataset Preparation Guide

## ✅ Your Dataset is Good!

Your CERT dataset folder contains all the necessary files:
- ✅ `logon.csv` (60MB, ~850k rows) - Login/logout events
- ✅ `device.csv` (4.8MB) - USB device connect/disconnect events
- ✅ `http.csv` (290MB) - Web browsing activity
- ✅ `LDAP/` folder - Employee directory information

**This is the standard CERT dataset format and is perfect for training!**

## 🔧 Dataset Preparation

### Option 1: Use the Preparation Script (Recommended)

I've created a script that combines all your CSV files into a unified format:

1. **Run the preparation script:**
   ```bash
   python prepare_cert_dataset.py "c:\Users\user\Downloads\r1 (1)\r1"
   ```

2. **Output:** Creates `cert_unified_dataset.csv` in the same folder

3. **What it does:**
   - Combines logon.csv, device.csv, and http.csv
   - Standardizes column names and formats
   - Handles timestamps correctly
   - Removes invalid data
   - Creates a unified format ready for feature extraction

### Option 2: Use Individual Files in Colab

You can also upload individual files to Colab, but you'll need to modify the notebook to handle them separately.

## 📊 Dataset Structure

After preparation, your unified dataset will have:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Event ID | `{Y6O4-A7KC67IN-0899AOZK}` |
| `timestamp` | Event timestamp | `2010-01-04 00:10:37` |
| `user_id` | User identifier | `DTAA/KEE0997` |
| `source_ip` | PC/IP address | `PC-1914` |
| `action` | Action type | `logon`, `logoff`, `device_connect`, `http_access` |
| `resource` | Resource accessed | URL, USB device, etc. |
| `status` | Event status | `success`, `failed` |
| `data_type` | Source data type | `logon`, `device`, `http` |

## 🚀 Using in Colab Notebook

### Method 1: Upload Unified Dataset (Easiest)

1. Run `prepare_cert_dataset.py` on your local machine first
2. Upload the resulting `cert_unified_dataset.csv` to Colab
3. Update the notebook to load this file directly:

```python
# In Colab notebook Step 6, replace with:
df = pd.read_csv('cert_unified_dataset.csv', low_memory=False)
```

### Method 2: Upload Raw Files and Combine in Colab

1. Upload `logon.csv`, `device.csv`, and `http.csv` to Colab
2. Use the preparation code in the notebook to combine them
3. Continue with feature extraction

## 📋 Step-by-Step Instructions

### Step 1: Prepare Dataset Locally (Recommended)

```bash
# Navigate to your project directory
cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main

# Run preparation script
python prepare_cert_dataset.py "c:\Users\user\Downloads\r1 (1)\r1"
```

**Expected output:**
```
🔧 Preparing CERT Dataset for Training
📂 Dataset directory: c:\Users\user\Downloads\r1 (1)\r1
📊 Step 1: Loading logon.csv...
   ✅ Loaded 849,580 logon events
📊 Step 2: Loading device.csv...
   ✅ Loaded XX device events
📊 Step 3: Loading http.csv...
   ✅ Loaded XX HTTP events
🔗 Step 4: Combining datasets...
   ✅ Combined dataset: XXX,XXX total events
...
✅ Dataset preparation complete!
```

### Step 2: Upload to Colab

1. Open Google Colab
2. Upload the `cert_unified_dataset.csv` file
3. Upload `colab_feature_extractor.py`
4. Run the notebook

### Step 3: Update Colab Notebook

In the notebook, replace Step 6 with:

```python
# Step 6: Load Unified Dataset
print("📊 Loading unified CERT dataset...")

# Load the prepared unified dataset
df = pd.read_csv('cert_unified_dataset.csv', low_memory=False)

print(f"✅ Loaded {len(df):,} events")
print(f"\nColumn names: {list(df.columns)}")
print(f"\nFirst few rows:")
print(df.head())
print(f"\nData types:")
print(df.dtypes)
print(f"\nEvent types:")
print(df['data_type'].value_counts())
```

## 📊 Dataset Statistics

Your dataset contains:
- **Logon events:** ~850,000 rows
- **Device events:** Several thousand rows
- **HTTP events:** Millions of rows (will be sampled)

**Total after combination:** ~1-2 million events (depending on HTTP sampling)

## ⚙️ Configuration Options

### For Testing (Small Dataset)

Modify `prepare_cert_dataset.py`:
```python
sample_size = 50000  # Use only 50k rows for quick testing
df = prepare_cert_dataset(dataset_dir, sample_size=sample_size)
```

### For Full Training (Large Dataset)

```python
sample_size = None  # Use all data
df = prepare_cert_dataset(dataset_dir, sample_size=sample_size)
```

**Note:** For full dataset, training will take longer but will be more accurate.

## 🎯 What Makes This Dataset Good

✅ **Complete data** - All three event types (logon, device, HTTP)  
✅ **Realistic format** - Standard CERT dataset structure  
✅ **Time series data** - Proper timestamps for sequence modeling  
✅ **User activities** - Tracks user behavior patterns  
✅ **Device information** - Includes PC/IP addresses  
✅ **Sufficient size** - Large enough for meaningful training  

## ⚠️ Important Notes

1. **HTTP File Size:** The http.csv is 290MB. The script will automatically sample it (10%) to keep the dataset manageable. For full training, you can modify the sampling rate.

2. **Memory Usage:** The unified dataset will be large. Make sure you have:
   - At least 4GB RAM for processing
   - Colab Pro recommended for large datasets

3. **Processing Time:** 
   - Dataset preparation: 5-10 minutes
   - Feature extraction: 10-30 minutes
   - Model training: 1-2 hours

4. **LDAP Files:** The LDAP directory contains employee information. You can use it to enrich the dataset with role information if needed (optional enhancement).

## 🔍 Validation Checklist

After preparation, verify:
- ✅ `cert_unified_dataset.csv` exists and is readable
- ✅ File size is reasonable (should be 50-200MB depending on sampling)
- ✅ Contains expected columns: `timestamp`, `user_id`, `source_ip`, `action`
- ✅ Timestamps are in correct format
- ✅ No null values in critical columns

## 🚀 Next Steps

1. ✅ Run `prepare_cert_dataset.py` to create unified dataset
2. ✅ Upload `cert_unified_dataset.csv` to Colab
3. ✅ Run the training notebook
4. ✅ Train the insider threat detection model
5. ✅ Download and integrate the trained model

---

**Your dataset is ready! 🎉**

Run the preparation script and you're ready to train your model!

