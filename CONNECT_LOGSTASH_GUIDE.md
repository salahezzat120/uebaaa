# How to Connect Logstash to Guardian Owl

## Step-by-Step Instructions

### 1. Ensure Logstash is Running

First, make sure Logstash is running on port 5044. If not, start it:

```powershell
# Option 1: Use the script
.\START_LOGSTASH_BACKGROUND.ps1

# Option 2: Manual start
cd logstash-9.2.3
.\bin\logstash.bat -f config\guardian-owl.conf
```

Wait until you see: `[INFO] Pipeline started successfully`

### 2. Open Guardian Owl Data Sources Page

1. Make sure your frontend is running (usually `http://localhost:8080`)
2. Navigate to **Data Sources** page
3. Click **"Add Source"** button (top right)

### 3. Fill in the Logstash Connection Form

In the "Add Data Source" dialog:

1. **Select "Logstash" tab** (should already be selected)

2. **Source Name:**
   - Enter: `Test Logstash` or `Production Logs`
   - Example: `Production Auth Logs`

3. **Logstash Endpoint:**
   - **For local Logstash:** `http://localhost:5044`
   - **For remote Logstash:** `http://your-server-ip:5044`
   - **Important:** Use `http://` not `https://` for local development

4. **Index Pattern:**
   - Enter: `logs-*`
   - This is used for Elasticsearch indexing (if you're using it later)

### 4. Click "Connect"

Click the green **"Connect"** button at the bottom.

### 5. What Happens Next

When you click "Connect":

1. ✅ **Data source is created** in the database
2. ✅ **Status changes to "connected"**
3. ✅ **Backend automatically starts the Logstash processor**
4. ✅ **Test logs start generating** every 2 seconds
5. ✅ **Each log is processed** through your AI models
6. ✅ **Anomaly detection runs** on each log entry
7. ✅ **Alerts are created** when anomalies are detected
8. ✅ **Results are saved** to `processed_rows` table

### 6. Verify Connection

You should see:

**In the Data Sources Page:**
- New data source card appears
- Status shows "connected" (green badge)
- Records count starts increasing
- Events/sec shows activity
- Health shows 95%+

**In the Backend Console (Node.js):**
```
[Data Sources] Starting Logstash processor for data source <id>
[Logstash Processor] Starting processor for data source <id> (interval: 2000ms)
[Logstash Processor] ✅ Normal log processed (#1): {user: 'john.doe@company.com', action: 'login', score: '45.2%'}
[Logstash Processor] 🔴 Anomaly detected (#2): {user: 'admin@company.com', action: 'execute_script', score: '87.3%'}
[Logstash Processor] ✅ Alert created: insider_threat (high) - admin@company.com
```

**In Alerts Page:**
- New alerts appear when anomalies are detected

**In Dashboard:**
- Stats update with new processed records
- Total Records increases
- Events/Second shows activity

## Troubleshooting

### Connection Fails

**Error: "Unable to connect"**
- Check if Logstash is running: `Test-NetConnection localhost -Port 5044`
- Make sure you're using `http://localhost:5044` (not https)
- Check the Logstash window for errors

### No Logs Processing

**Status shows "connected" but no records**
- Check backend console for errors
- Verify FastAPI is running (required for AI model inference)
- Check Node.js backend logs for issues

### Alerts Not Creating

**Logs processing but no alerts**
- Alerts only create when anomaly score > 70%
- Check if you have active AI models enabled
- Verify models are loaded in FastAPI

## Current Implementation Notes

**Important:** The current implementation:
- ✅ **Stores the Logstash endpoint** in the database
- ✅ **Generates test data automatically** when connected
- ✅ **Processes logs through AI models**
- ✅ **Creates alerts for anomalies**

**Future Enhancement:** To connect to a REAL Logstash server (instead of generating test data), you would need to:
1. Modify `backend-node/src/services/logstashProcessor.js`
2. Add HTTP client to connect to the Logstash endpoint
3. Subscribe to log streams from Logstash
4. Parse and forward logs to the AI processing pipeline

For now, the test data generator works perfectly to demonstrate the full workflow!

## Example Configuration

**For Local Testing:**
- Source Name: `Local Test Logstash`
- Logstash Endpoint: `http://localhost:5044`
- Index Pattern: `logs-*`

**For Production (when real Logstash is set up):**
- Source Name: `Production Security Logs`
- Logstash Endpoint: `http://logstash-prod.company.com:5044`
- Index Pattern: `security-logs-*`




