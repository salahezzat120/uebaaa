# Anomaly Detection Improvements

## Changes Made

### 1. Increased Anomaly Threshold
- **Before:** 60% (0.6) - Too sensitive, many false positives
- **After:** 70% (0.7) - Better balance, reduces false positives

### 2. Improved Detection Logic

**Better Normal Behavior Recognition:**
- Admin actions during business hours (8 AM - 6 PM) from internal IPs are now treated as normal
- Reduced base error for normal patterns
- Better context awareness using sequence data

**Enhanced Anomaly Detection:**
- Failed logins now have higher weight (0.35 vs 0.2)
- Multiple failed logins in sequence detected as brute force (0.3 bonus)
- Script execution always flagged (0.25 weight)
- External IPs only flagged when combined with suspicious activity
- Off-hours activity has graduated penalties (very late/early = higher)

**Sequence Context:**
- Detects patterns across multiple rows
- Brute force detection (3+ failed logins in 5 rows)
- Rapid escalation patterns (failed login → script → admin)

## Expected Results After Fix

### Normal Activities (Should be Normal):
- ✅ Regular logins during business hours: **30-50%** → Normal
- ✅ Admin actions 8 AM - 6 PM from internal IP: **40-60%** → Normal
- ✅ File access/download during work hours: **30-50%** → Normal

### Anomaly Activities (Should be Anomaly):
- 🚨 Failed logins: **70-100%** → Anomaly
- 🚨 Multiple failed logins (brute force): **85-100%** → Anomaly
- 🚨 Script execution: **75-95%** → Anomaly
- 🚨 External IP + failed login: **85-100%** → Anomaly
- 🚨 Off-hours suspicious activity: **70-100%** → Anomaly
- 🚨 Admin actions outside business hours: **70-85%** → Anomaly

## Test Again

1. **Re-upload the CSV file:**
   - Go to Data Sources page
   - Upload `test-anomaly-detection.csv` again
   - Watch the new results

2. **Expected Improvements:**
   - Fewer false positives on normal admin actions
   - Better detection of actual attacks
   - More accurate anomaly scores

## Threshold Adjustment

If you want to adjust the threshold further:

**File:** `src/services/modelService.ts`
**Line:** 103, 124
**Change:** `anomalyScore > 0.7` to your preferred value
- `0.65` = More sensitive (more anomalies detected)
- `0.7` = Balanced (current)
- `0.75` = Less sensitive (fewer false positives)

## Color Coding in UI

- **Green (0-50%):** Normal
- **Orange (50-70%):** Suspicious but not anomaly
- **Red (70-100%):** Anomaly detected





