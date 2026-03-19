# Quick Start: Run Logstash

## The Error You're Seeing

```
Unable to connect to the remote server
```

This means **Logstash is not running**. You need to start it first!

## Solution: Start Logstash

### Option 1: Start in New Window (Recommended)

Run this from the project root:

```powershell
.\START_LOGSTASH_BACKGROUND.ps1
```

This will open a new window with Logstash running. Keep that window open!

### Option 2: Start Manually

1. Open a **new PowerShell window** (keep it separate from your test script)

2. Navigate to the project:
   ```powershell
   cd C:\Users\user\Documents\GitHub\ueba-grad\guardian-owl-main
   ```

3. Start Logstash:
   ```powershell
   cd logstash-9.2.3
   .\bin\logstash.bat -f config\guardian-owl.conf
   ```

4. Wait for this message:
   ```
   [INFO] Pipeline started successfully
   ```

5. **Keep this window open!** Logstash must keep running.

### Option 3: Simple One-Liner

From project root:

```powershell
Start-Process -FilePath "logstash-9.2.3\bin\logstash.bat" -ArgumentList "-f", "logstash-9.2.3\config\guardian-owl.conf"
```

## Then Test

Once Logstash is running (you'll see logs in the Logstash window), **in a different PowerShell window**, run:

```powershell
cd logstash-9.2.3
.\test-log.ps1
```

You should now see:
```
[1] ✅ Sent: login from john.doe@company.com - success
[2] ✅ Sent: access_file from jane.smith@company.com - failed
...
```

## Important Notes

1. **Logstash must stay running** - Don't close the Logstash window
2. **Use separate windows** - One for Logstash, one for testing
3. **Wait for startup** - Give Logstash 10-15 seconds to fully start
4. **Check the Logstash window** - You should see log entries appearing there

## Troubleshooting

### Port 5044 Already in Use

If you get "port already in use", either:
1. Stop the other service using port 5044, OR
2. Change the port in `logstash-9.2.3/config/guardian-owl.conf`:
   ```ruby
   http {
     port => 5045  # Change to different port
   }
   ```

### Java Not Found

Make sure Java is installed:
```powershell
java -version
```

Should show Java 11 or higher.

### Logstash Crashes Immediately

Check the error message in the Logstash window. Common issues:
- Missing Java
- Invalid config file
- Port conflicts

## Verify Logstash is Running

Test if port 5044 is open:

```powershell
Test-NetConnection -ComputerName localhost -Port 5044
```

Should show `TcpTestSucceeded : True`




