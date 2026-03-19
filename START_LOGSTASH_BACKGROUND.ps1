# Start Logstash in background
# This script starts Logstash and keeps it running

Write-Host "Starting Logstash..." -ForegroundColor Green

$logstashPath = "logstash-9.2.3\bin\logstash.bat"
$configPath = "logstash-9.2.3\config\guardian-owl.conf"

if (-not (Test-Path $logstashPath)) {
    Write-Host "Error: Logstash not found at $logstashPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $configPath)) {
    Write-Host "Error: Config file not found at $configPath" -ForegroundColor Red
    exit 1
}

Write-Host "Logstash will start in a new window..." -ForegroundColor Yellow
Write-Host "Config: $configPath" -ForegroundColor Cyan
Write-Host "Listening on: http://localhost:5044" -ForegroundColor Cyan
Write-Host ""

# Start Logstash in a new window
Start-Process -FilePath $logstashPath -ArgumentList "-f", $configPath -WindowStyle Normal

Write-Host "Logstash started! Check the new window for status." -ForegroundColor Green
Write-Host "Wait a few seconds for it to fully start, then test with .\logstash-9.2.3\test-log.ps1" -ForegroundColor Yellow




