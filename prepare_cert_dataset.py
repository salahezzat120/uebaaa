"""
Prepare CERT Dataset for Insider Threat Model Training
Combines logon.csv, device.csv, and http.csv into a unified format
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import os
import sys

# Fix Windows console encoding for emoji
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def prepare_cert_dataset(dataset_dir, output_file='cert_unified_dataset.csv', sample_size=None):
    """
    Combine CERT dataset files into a unified format for training
    
    Args:
        dataset_dir: Path to directory containing logon.csv, device.csv, http.csv
        output_file: Output filename for unified dataset
        sample_size: Optional - limit number of rows (useful for testing)
    
    Returns:
        DataFrame with unified format
    """
    print("=" * 60)
    print("[PREPARE] Preparing CERT Dataset for Training")
    print("=" * 60)
    
    dataset_path = Path(dataset_dir)
    
    # Check if files exist
    logon_file = dataset_path / 'logon.csv'
    device_file = dataset_path / 'device.csv'
    http_file = dataset_path / 'http.csv'
    
    if not logon_file.exists():
        raise FileNotFoundError(f"logon.csv not found in {dataset_dir}")
    
    print(f"\n[DIR] Dataset directory: {dataset_dir}")
    
    # 1. Load Logon Data
    print("\n[STEP 1] Loading logon.csv...")
    logon_df = pd.read_csv(logon_file, low_memory=False)
    print(f"   [OK] Loaded {len(logon_df):,} logon events")
    
    # Standardize logon data
    logon_df['action'] = logon_df['activity'].str.lower()
    logon_df['source_ip'] = logon_df['pc']
    logon_df['timestamp'] = pd.to_datetime(logon_df['date'], format='%m/%d/%Y %H:%M:%S', errors='coerce')
    logon_df['resource'] = ''
    logon_df['status'] = 'success'  # Logons are typically successful
    logon_df['data_type'] = 'logon'
    
    # Select relevant columns
    logon_clean = logon_df[['id', 'timestamp', 'user', 'source_ip', 'action', 'resource', 'status', 'data_type']].copy()
    logon_clean = logon_clean.rename(columns={'user': 'user_id'})
    
    # 2. Load Device Data (USB/Thumb drive)
    if device_file.exists():
        print("\n[STEP 2] Loading device.csv...")
        device_df = pd.read_csv(device_file, low_memory=False)
        print(f"   [OK] Loaded {len(device_df):,} device events")
        
        # Standardize device data
        device_df['action'] = 'device_' + device_df['activity'].str.lower()
        device_df['source_ip'] = device_df['pc']
        device_df['timestamp'] = pd.to_datetime(device_df['date'], format='%m/%d/%Y %H:%M:%S', errors='coerce')
        device_df['resource'] = 'USB_Device'
        device_df['status'] = 'success'
        device_df['data_type'] = 'device'
        
        device_clean = device_df[['id', 'timestamp', 'user', 'source_ip', 'action', 'resource', 'status', 'data_type']].copy()
        device_clean = device_clean.rename(columns={'user': 'user_id'})
    else:
        print("\n[WARN] Step 2: device.csv not found, skipping...")
        device_clean = pd.DataFrame()
    
    # 3. Load HTTP Data
    if http_file.exists():
        print("\n[STEP 3] Loading http.csv...")
        # For large files, we might need to sample
        print("   [INFO] This may take a while (file is ~290MB)...")
        
        try:
            http_df = pd.read_csv(http_file, low_memory=False)
            print(f"   [OK] Loaded {len(http_df):,} HTTP events")
            
            # Sample HTTP data if too large (keep every 10th row to reduce size)
            if len(http_df) > 1000000:
                print("   [SAMPLE] Sampling HTTP data (keeping 10% for manageable size)...")
                http_df = http_df.sample(frac=0.1, random_state=42)
                print(f"   [OK] Sampled to {len(http_df):,} HTTP events")
            
            # Standardize HTTP data
            http_df['action'] = 'http_access'
            http_df['source_ip'] = http_df['pc']
            http_df['timestamp'] = pd.to_datetime(http_df['date'], format='%m/%d/%Y %H:%M:%S', errors='coerce')
            http_df['resource'] = http_df['url'].fillna('')
            http_df['status'] = 'success'
            http_df['data_type'] = 'http'
            
            http_clean = http_df[['id', 'timestamp', 'user', 'source_ip', 'action', 'resource', 'status', 'data_type']].copy()
            http_clean = http_clean.rename(columns={'user': 'user_id'})
        except Exception as e:
            print(f"   [ERROR] Error loading http.csv: {e}")
            print("   [WARN] Continuing without HTTP data...")
            http_clean = pd.DataFrame()
    else:
        print("\n[WARN] Step 3: http.csv not found, skipping...")
        http_clean = pd.DataFrame()
    
    # 4. Combine all data
    print("\n[STEP 4] Combining datasets...")
    combined_dfs = [logon_clean]
    
    if len(device_clean) > 0:
        combined_dfs.append(device_clean)
    if len(http_clean) > 0:
        combined_dfs.append(http_clean)
    
    unified_df = pd.concat(combined_dfs, ignore_index=True)
    print(f"   [OK] Combined dataset: {len(unified_df):,} total events")
    
    # 5. Remove rows with invalid timestamps
    print("\n[STEP 5] Cleaning data...")
    initial_count = len(unified_df)
    unified_df = unified_df.dropna(subset=['timestamp', 'user_id'])
    cleaned_count = len(unified_df)
    
    if initial_count != cleaned_count:
        print(f"   [OK] Removed {initial_count - cleaned_count:,} rows with invalid data")
    
    # 6. Sort by timestamp
    unified_df = unified_df.sort_values('timestamp').reset_index(drop=True)
    print(f"   [OK] Sorted by timestamp")
    
    # 7. Add metadata columns that feature extractor might need
    unified_df['date'] = unified_df['timestamp'].dt.date
    unified_df['time'] = unified_df['timestamp'].dt.time
    unified_df['user_email'] = unified_df['user_id'] + '@dtaa.com'  # Add email domain
    
    # 8. Sample if requested
    if sample_size and len(unified_df) > sample_size:
        print(f"\n[STEP 6] Sampling to {sample_size:,} rows...")
        unified_df = unified_df.sample(n=sample_size, random_state=42).sort_values('timestamp').reset_index(drop=True)
        print(f"   [OK] Sampled dataset: {len(unified_df):,} events")
    
    # 9. Display summary
    print("\n" + "=" * 60)
    print("[SUMMARY] Dataset Summary")
    print("=" * 60)
    print(f"Total Events: {len(unified_df):,}")
    print(f"Date Range: {unified_df['timestamp'].min()} to {unified_df['timestamp'].max()}")
    print(f"Unique Users: {unified_df['user_id'].nunique()}")
    print(f"Unique PCs/IPs: {unified_df['source_ip'].nunique()}")
    print(f"\nEvent Types:")
    print(unified_df['data_type'].value_counts())
    print(f"\nAction Types:")
    print(unified_df['action'].value_counts().head(10))
    
    # 10. Save unified dataset
    output_path = dataset_path / output_file
    print(f"\n[STEP 7] Saving unified dataset...")
    unified_df.to_csv(output_path, index=False)
    file_size = output_path.stat().st_size / (1024 * 1024)  # MB
    print(f"   [OK] Saved to: {output_path}")
    print(f"   [INFO] File size: {file_size:.2f} MB")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Dataset preparation complete!")
    print("=" * 60)
    print(f"\n[OUTPUT] Output file: {output_path}")
    print(f"[DATA] Ready for training with {len(unified_df):,} events")
    print(f"\n[NEXT STEPS]")
    print(f"   1. Use this file in your Colab notebook")
    print(f"   2. The feature extractor will process it automatically")
    print(f"   3. Model will be trained on this unified dataset")
    
    return unified_df


if __name__ == '__main__':
    import sys
    
    # Default dataset directory
    if len(sys.argv) > 1:
        dataset_dir = sys.argv[1]
    else:
        # Use the r1 folder if running locally
        dataset_dir = r'c:\Users\user\Downloads\r1 (1)\r1'
    
    # Optional: limit dataset size for testing (set to None for full dataset)
    sample_size = None  # Set to 50000 for quick testing
    
    try:
        df = prepare_cert_dataset(dataset_dir, sample_size=sample_size)
        print("\n[SUCCESS] Dataset preparation completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

