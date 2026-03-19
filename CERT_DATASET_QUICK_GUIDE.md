# CERT Dataset - Quick Download & Use Guide
## Get the Best Insider Threat Dataset in 10 Minutes

---

## 🚀 Quick Start

### **Step 1: Register (2 minutes)**

1. Go to: **https://www.cert.org/insider-threat-tools/datasets/**
2. Click **"Request Dataset"** or **"Download"**
3. Fill registration form:
   - Name, Email, Organization
   - Purpose: "Research" or "Educational"
   - Agree to terms
4. Submit (usually approved instantly)

### **Step 2: Download (5 minutes)**

1. Check your email for download link
2. Click download link
3. Download file (usually 1-5 GB, RAR or ZIP format)
4. Extract to a folder

### **Step 3: Use (3 minutes)**

```python
# Load CERT dataset
import pandas as pd

# CERT dataset structure
df = pd.read_csv('cert_dataset/logon.csv')

# See what's inside
print(df.head())
print(df.columns)
```

---

## 📁 CERT Dataset Structure

Typical structure after extraction:

```
cert_dataset/
├── logon.csv          # Login/logout events ⭐ MOST IMPORTANT
├── file.csv           # File access events
├── email.csv          # Email activities
├── device.csv         # USB/device connections
├── http.csv           # Web browsing
├── psychometric.csv   # User psychometric data
└── README.txt         # Documentation
```

**For your use case, focus on:**
- ✅ `logon.csv` - Login events (brute force detection)
- ✅ `file.csv` - File access (data exfiltration)
- ✅ `device.csv` - Device connections (suspicious activity)

---

## 🔧 Quick Integration Script

```python
# load_cert_for_training.py
import pandas as pd
import os
from datetime import datetime

def load_cert_logon_data(cert_path: str):
    """
    Load CERT logon data and convert to your format
    """
    logon_file = os.path.join(cert_path, 'logon.csv')
    
    if not os.path.exists(logon_file):
        print(f"❌ File not found: {logon_file}")
        return None
    
    # Load CERT data
    df = pd.read_csv(logon_file)
    print(f"✅ Loaded {len(df)} logon events")
    
    # CERT columns (example - may vary by version):
    # user, pc, activity, date, time, ...
    
    # Map to your format
    result_df = pd.DataFrame({
        'user_id': df['user'],
        'timestamp': pd.to_datetime(df['date'] + ' ' + df['time']),
        'action': 'login',
        'source_ip': df.get('pc', 'unknown'),  # Use PC as IP proxy
        'resource': '/login',
        'status': df['activity'].apply(
            lambda x: 'success' if 'Logon' in str(x) else 'failed'
        )
    })
    
    # Sort by timestamp
    result_df = result_df.sort_values('timestamp')
    
    print(f"✅ Converted to {len(result_df)} rows")
    return result_df

# Usage
if __name__ == "__main__":
    cert_path = "path/to/cert/dataset"  # Update this path
    
    df = load_cert_logon_data(cert_path)
    
    if df is not None:
        # Save in your format
        df.to_csv('cert_data_formatted.csv', index=False)
        print("✅ Saved to: cert_data_formatted.csv")
        print("\nFirst few rows:")
        print(df.head())
```

---

## 🎯 Use with Your Training Script

```python
# Update train_insider_threat_model.py
import pandas as pd

# Option 1: Use CERT data
cert_df = pd.read_csv('cert_data_formatted.csv')

# Option 2: Use your synthetic data
# synthetic_df = create_synthetic_training_data()

# Option 3: Combine both
df = pd.concat([cert_df, synthetic_df], ignore_index=True)

# Continue with your training...
```

---

## 📊 CERT Dataset Columns (Typical)

### **logon.csv:**
- `user` - User ID
- `pc` - Computer name/IP
- `activity` - Logon/Logoff
- `date` - Date
- `time` - Time
- `id` - Event ID

### **file.csv:**
- `user` - User ID
- `pc` - Computer name
- `filename` - File accessed
- `date` - Date
- `time` - Time
- `activity` - File action (Read, Write, Copy, etc.)

---

## ✅ Checklist

- [ ] Registered on CERT website
- [ ] Received download link
- [ ] Downloaded dataset
- [ ] Extracted files
- [ ] Loaded data into Python
- [ ] Converted to your format
- [ ] Used in training script

---

## 🐛 Troubleshooting

### **Registration not working?**
- Try different browser
- Check spam folder for email
- Contact CERT support

### **Download link expired?**
- Re-register
- Check email for new link

### **File format issues?**
- Check README.txt in dataset
- Column names may vary by version
- Adjust mapping in script

### **Data too large?**
- Use subset for initial testing
- Sample data: `df.sample(n=10000)`

---

## 📚 Additional Resources

- **CERT Documentation:** Included in dataset download
- **Research Papers:** Search "CERT insider threat" on Google Scholar
- **Your Guide:** See `BEST_INSIDER_THREAT_DETECTION.md` for details

---

## 🎯 Quick Command Reference

```bash
# Extract dataset
unzip cert_dataset.zip
# or
unrar x cert_dataset.rar

# Check file structure
ls cert_dataset/

# Load in Python
python load_cert_for_training.py

# Train model
python train_insider_threat_model.py
```

---

**That's it! You're ready to use the best insider threat dataset!** 🚀





