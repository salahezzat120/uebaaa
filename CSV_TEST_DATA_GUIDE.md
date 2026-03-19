# CSV Test Data Guide

## Test File Created: `test-anomaly-detection.csv`

This CSV file contains **100 rows** with a mix of **normal** and **abnormal** behavior patterns to test your LSTM Autoencoder model.

## What's in the File

### ✅ Normal Behavior (Low Anomaly Score Expected)

**Patterns:**
- Regular business hours (9 AM - 5 PM)
- Internal IP addresses (192.168.x.x)
- Known users (john.doe, jane.smith, admin)
- Standard actions: login, access_file, download_file, upload_file
- Successful operations
- Normal resource paths

**Examples:**
- `john.doe@company.com` logging in at 9:15 AM from internal IP
- `jane.smith@company.com` accessing files during work hours
- `admin@company.com` performing admin actions during business hours

### 🚨 Abnormal Behavior (High Anomaly Score Expected)

**Pattern 1: Brute Force Attack**
- **User:** `suspicious.user@external.com`
- **Time:** 2:15 AM (off-hours)
- **IP:** External (203.0.113.45)
- **Pattern:** 5 failed login attempts in rapid succession
- **Expected:** High anomaly score (85-95%)

**Pattern 2: External Hacker**
- **User:** `unknown.hacker@malicious.com`
- **Time:** 3:30 AM (off-hours)
- **IP:** External (198.51.100.99)
- **Pattern:** Failed login → execute_script → admin_action → access_file
- **Expected:** Very high anomaly score (90-100%)

**Pattern 3: Night Attack**
- **User:** `malicious.actor@attacker.com`
- **Time:** 11:45 PM (late night)
- **IP:** External (203.0.113.100)
- **Pattern:** Multiple failed logins → script execution → admin delete → path traversal
- **Expected:** Critical anomaly score (95-100%)

**Pattern 4: Insider Threat**
- **User:** `insider.threat@company.com`
- **Time:** 4:30 AM (very early morning)
- **IP:** Internal (192.168.1.200) but unusual time
- **Pattern:** Accessing confidential files → downloading → executing export script
- **Expected:** High anomaly score (70-85%)

## How to Test

### 1. Upload the CSV

1. Go to: http://localhost:8080/data-sources
2. Click **"Upload CSV"**
3. Select: `public/test-anomaly-detection.csv`
4. Name it: "Anomaly Detection Test"
5. Click **"Upload & Start Real-Time Processing"**

### 2. Watch the Processing

- Processing will start automatically
- Watch each row get processed
- See anomaly scores in real-time

### 3. Expected Results

**Normal Rows (john.doe, jane.smith, admin during 9-5):**
- Anomaly Score: **30-50%** (Normal)
- Result: **Normal** ✅

**Abnormal Rows (suspicious users, off-hours, external IPs):**
- Anomaly Score: **70-100%** (Anomaly)
- Result: **Anomaly** 🚨

## What the Model Detects

Your LSTM Autoencoder will detect anomalies based on:

1. **Time Patterns:** Off-hours activity (2 AM, 3 AM, 11 PM, 4 AM)
2. **IP Patterns:** External IPs (203.x.x.x, 198.x.x.x) vs Internal (192.168.x.x)
3. **Action Sequences:** Unusual action chains (failed login → execute_script → admin_action)
4. **User Patterns:** Unknown users vs known users
5. **Status Patterns:** Multiple failed logins
6. **Resource Patterns:** Path traversal attempts (`../../../../etc/passwd`)

## File Statistics

- **Total Rows:** 100
- **Normal Rows:** ~75 (75%)
- **Anomaly Rows:** ~25 (25%)
- **Time Range:** 9:15 AM - 11:45 PM (same day)
- **Users:** 7 unique users
- **IPs:** Mix of internal (192.168.x.x) and external (203.x.x.x, 198.x.x.x)

## Tips for Testing

1. **Watch the first 20 rows** - These are mostly normal, so scores should be low
2. **Watch rows 16-20** - First anomaly pattern (brute force)
3. **Watch rows 21-24** - External hacker pattern
4. **Watch rows 48-53** - Night attack pattern
5. **Watch rows 64-68** - Insider threat pattern

## Expected Anomaly Distribution

- **Rows 1-15:** Normal (30-50% scores)
- **Rows 16-20:** 🚨 Brute Force (85-95% scores)
- **Rows 21-24:** 🚨 External Hacker (90-100% scores)
- **Rows 25-47:** Normal (30-50% scores)
- **Rows 48-53:** 🚨 Night Attack (95-100% scores)
- **Rows 54-63:** Normal (30-50% scores)
- **Rows 64-68:** 🚨 Insider Threat (70-85% scores)
- **Rows 69-100:** Normal (30-50% scores)

## File Location

The test file is saved at:
```
public/test-anomaly-detection.csv
```

You can also find it in your project root or access it directly in the browser at:
```
http://localhost:8080/test-anomaly-detection.csv
```

Happy testing! 🎯





