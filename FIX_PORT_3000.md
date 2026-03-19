# Fix "Port 3000 Already in Use" Error

## Quick Fix

Port 3000 is already being used by another process. Here's how to fix it:

### Option 1: Kill the Process Using Port 3000 (Recommended)

**PowerShell:**
```powershell
# Find the process
$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port) {
    $pid = $port.OwningProcess
    Stop-Process -Id $pid -Force
    Write-Host "Killed process $pid"
} else {
    Write-Host "No process found on port 3000"
}
```

**Or manually:**
```powershell
# Step 1: Find the process ID
netstat -ano | findstr :3000

# Step 2: Kill it (replace <PID> with the number from step 1)
taskkill /PID <PID> /F
```

### Option 2: Use a Different Port

Change the port in `backend-node/.env`:
```env
PORT=3001
```

Or update `backend-node/src/server.js` to use a different port.

### Option 3: Check What's Running

**See all Node processes:**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime
```

**Kill all Node processes (careful!):**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Recommended Solution

Run this PowerShell command to automatically find and kill the process:

```powershell
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    $pid = $conn.OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Killing process: $($proc.ProcessName) (PID: $pid)"
        Stop-Process -Id $pid -Force
        Write-Host "✅ Process killed. You can now start the server."
    }
} else {
    Write-Host "No process found on port 3000"
}
```

Then restart your Node.js backend:
```powershell
cd backend-node
npm run dev
```





