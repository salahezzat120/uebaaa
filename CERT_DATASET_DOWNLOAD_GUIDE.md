# CERT Dataset Download Guide for Google Colab

## Quick Steps to Download CERT Dataset to Colab

### Option 1: Direct Download in Colab (Recommended)

1. **Get the dataset URL from KiltHub:**
   - Visit: https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247/1
   - You may need to register/login to get download access
   - Find the download link for the dataset file (usually `r3.1.tar.bz2` or similar)

2. **Download directly in Colab:**
   ```python
   # Add this cell to your Colab notebook
   import requests
   import os
   
   # Replace with actual download URL from KiltHub
   # You may need to get this URL after logging in
   dataset_url = "YOUR_DOWNLOAD_URL_HERE"
   
   print("📥 Downloading CERT dataset...")
   response = requests.get(dataset_url, stream=True)
   
   # Save to Colab
   dataset_file = "/content/cert_dataset.tar.bz2"
   with open(dataset_file, 'wb') as f:
       for chunk in response.iter_content(chunk_size=8192):
           f.write(chunk)
   
   print(f"✅ Downloaded: {dataset_file}")
   print(f"   Size: {os.path.getsize(dataset_file) / (1024**3):.2f} GB")
   ```

### Option 2: Upload from Local Machine

1. **Download dataset to your computer:**
   - Visit: https://kilthub.cmu.edu/articles/dataset/Insider_Threat_Test_Dataset/12841247/1
   - Download the dataset file (`.tar.bz2` or `.zip`)
   - File size: ~3-5 GB

2. **Upload to Colab:**
   ```python
   from google.colab import files
   
   print("📁 Please select the CERT dataset file to upload...")
   uploaded = files.upload()
   
   # The file will be uploaded to /content/
   for filename in uploaded.keys():
       print(f"✅ Uploaded: {filename}")
   ```

### Option 3: Use Google Drive

1. **Upload dataset to Google Drive:**
   - Download dataset to your computer
   - Upload to your Google Drive

2. **Mount Drive in Colab:**
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   
   # Copy dataset from Drive to Colab
   !cp "/content/drive/MyDrive/cert_dataset.tar.bz2" /content/
   ```

## Extract the Dataset

After downloading/uploading, extract it:

```python
import tarfile
import os

dataset_file = "/content/cert_dataset.tar.bz2"  # or your file path
extract_path = "/content/extracted"

print(f"📦 Extracting {dataset_file}...")
with tarfile.open(dataset_file, 'r:bz2') as tar:
    tar.extractall(extract_path)

print(f"✅ Extracted to: {extract_path}")

# List extracted files
extracted_files = os.listdir(extract_path)
print(f"\n📁 Extracted {len(extracted_files)} items:")
for item in extracted_files[:10]:  # Show first 10
    print(f"  - {item}")
```

## Dataset Structure

The CERT dataset typically contains:

```
extracted/
├── r3.1/                    # or r4.2, etc.
│   ├── logon.csv            # Login/logout events
│   ├── file.csv             # File access events
│   ├── email.csv            # Email events
│   ├── device.csv           # Device connection events
│   ├── http.csv             # Web browsing events
│   ├── answers.txt          # Ground truth (malicious users)
│   └── README.txt           # Dataset documentation
```

## Important Notes

1. **Registration Required:**
   - You may need to register on KiltHub to download
   - Registration is free for research/educational use

2. **File Size:**
   - Dataset is large (~3-5 GB compressed)
   - Ensure you have enough Colab storage (Colab Pro recommended)

3. **Processing Time:**
   - Feature extraction may take 10-30 minutes depending on dataset size
   - Training may take 1-2 hours on GPU

4. **Colab Pro Benefits:**
   - More RAM (32GB vs 12GB)
   - Better GPU (T4 vs K80)
   - Longer session time
   - Faster processing

## Troubleshooting

### Issue: "File not found" or "Permission denied"
- Make sure you've extracted the dataset correctly
- Check file paths match your actual structure

### Issue: "Out of memory"
- Use Colab Pro for more RAM
- Process data in smaller batches
- Reduce sequence length or features

### Issue: "Download failed"
- Check your internet connection
- Try downloading in smaller chunks
- Use Google Drive upload method instead

## Next Steps

After downloading and extracting:
1. Continue with the Colab notebook
2. The notebook will automatically find and load the CSV files
3. Feature extraction will process the data
4. Model training will begin automatically

---

**Need Help?**
- Check CERT dataset documentation in the extracted README.txt
- Review the Colab notebook comments for guidance
- Ensure all required libraries are installed



