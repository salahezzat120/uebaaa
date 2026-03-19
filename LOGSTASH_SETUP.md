# Logstash Endpoint Setup Guide

## What is a Logstash Endpoint?

A Logstash endpoint is the URL/address where a Logstash server is listening for incoming log data. In production, this would be a real Logstash server that collects logs from various sources.

## For Testing (Current Implementation)

**Good News:** For the test data system, you can use **any placeholder value** because the system generates test logs internally. The endpoint value is stored but not actually used to connect to a real Logstash server.

### Example Test Values:
- `https://logstash.company.com:5044`
- `http://localhost:5044`
- `test-logstash-endpoint`
- `logstash://example.com:5044`

**The system will work with any value** - it's just stored in the database for reference.

## Setting Up a Real Logstash Server (Optional)

If you want to connect to a real Logstash server for production use, here's how:

### Option 1: Install Logstash Locally

1. **Download Logstash:**
   ```bash
   # Windows (using Chocolatey)
   choco install logstash
   
   # Or download from: https://www.elastic.co/downloads/logstash
   ```

2. **Create Logstash Config** (`logstash.conf`):
   ```ruby
   input {
     beats {
       port => 5044
     }
     http {
       port => 5044
       codec => json
     }
   }
   
   filter {
     # Add any filtering/transformation here
   }
   
   output {
     stdout {
       codec => rubydebug
     }
     # Or output to Elasticsearch, file, etc.
   }
   ```

3. **Start Logstash:**
   ```bash
   logstash -f logstash.conf
   ```

4. **Your Endpoint Would Be:**
   - `http://localhost:5044` (if running locally)
   - `http://your-server-ip:5044` (if on remote server)

### Option 2: Use Docker

1. **Run Logstash in Docker:**
   ```bash
   docker run -d \
     -p 5044:5044 \
     -v /path/to/logstash.conf:/usr/share/logstash/pipeline/logstash.conf \
     docker.elastic.co/logstash/logstash:8.11.0
   ```

2. **Endpoint:**
   - `http://localhost:5044` (if running locally)
   - `http://your-docker-host:5044` (if on remote)

### Option 3: Use Cloud Logstash Service

Many cloud providers offer managed Logstash services:
- **Elastic Cloud** (Elasticsearch Service)
- **AWS** (via Elasticsearch Service)
- **Azure** (via Elasticsearch on Azure)

You'll get an endpoint URL from your cloud provider.

## Common Logstash Ports

- **5044** - Beats input (most common)
- **5000** - TCP input
- **9200** - Elasticsearch output
- **514** - Syslog input

## For This Project (Test Mode)

Since the current implementation generates test data internally, you can:

1. **Use any placeholder value** when creating the Logstash data source
2. **The endpoint is stored but not validated** - it's just metadata
3. **Test logs are generated automatically** when you connect the data source

### Quick Test Setup:

1. Go to **Data Sources** page
2. Click **"Add Source"**
3. Select **"Logstash"** tab
4. Enter:
   - **Source Name:** `Test Logstash`
   - **Logstash Endpoint:** `http://test-logstash:5044` (any value works)
   - **Index Pattern:** `logs-*`
5. Click **"Connect"**
6. The system will start generating and processing test logs automatically!

## Future: Real Logstash Integration

To connect to a real Logstash server, you would need to:

1. **Modify `logstashProcessor.js`** to:
   - Connect to the actual Logstash endpoint
   - Subscribe to log streams (via Beats, HTTP, or TCP)
   - Parse incoming log events
   - Process them through AI models

2. **Example Real Connection:**
   ```javascript
   // Connect to Logstash HTTP input
   const response = await axios.post(logstashEndpoint, {
     log: logData
   });
   ```

## Summary

- **For Testing:** Use any placeholder value (e.g., `http://test:5044`)
- **For Production:** Set up a real Logstash server and use its actual endpoint
- **Current System:** Generates test data automatically, endpoint is just metadata




