# Quick test to see if Logstash is running
Write-Host "Testing Logstash connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if port is open
Write-Host "1. Checking port 5044..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5044 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portTest) {
    Write-Host "   ✅ Port 5044 is open" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 5044 is NOT open - Logstash is not running" -ForegroundColor Red
}

# Test 2: Check for Java process
Write-Host "2. Checking for Java process (Logstash runs on Java)..." -ForegroundColor Yellow
$javaProcess = Get-Process -Name java -ErrorAction SilentlyContinue
if ($javaProcess) {
    Write-Host "   ✅ Java process found (Logstash might be running)" -ForegroundColor Green
    Write-Host "   Process ID: $($javaProcess.Id)" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ No Java process found - Logstash is NOT running" -ForegroundColor Red
}

# Test 3: Try to send a test log
Write-Host "3. Testing HTTP connection..." -ForegroundColor Yellow
try {
    $body = @{
        user_id = "test@company.com"
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        action = "login"
        source_ip = "192.168.1.1"
        resource = "/test"
        status = "success"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5044" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Successfully connected and sent log!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "If Logstash is not running, start it with:" -ForegroundColor Yellow
Write-Host "  cd logstash-9.2.3" -ForegroundColor Cyan
Write-Host "  .\bin\logstash.bat -f config\guardian-owl.conf" -ForegroundColor Cyan




