# Guardian Owl - Start All Services in Background Script
# This script starts all services in the background (no new windows)

$ErrorActionPreference = "Stop"

# Get the script directory (project root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Guardian Owl - Starting Services     " -ForegroundColor Green
Write-Host "  (Running in background)              " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Start FastAPI
Write-Host "Starting FastAPI..." -ForegroundColor Cyan
Start-Process python -ArgumentList "$ScriptDir\backend-fastapi\main.py" -WindowStyle Hidden
Start-Sleep -Seconds 2

# Start Node.js Backend
Write-Host "Starting Node.js Backend..." -ForegroundColor Cyan
Set-Location "$ScriptDir\backend-node"
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Set-Location $ScriptDir
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden
Start-Sleep -Seconds 2

# Start Logstash (if available)
if (Test-Path "$ScriptDir\logstash-9.2.3\bin\logstash.bat") {
    Write-Host "Starting Logstash..." -ForegroundColor Cyan
    Set-Location "$ScriptDir\logstash-9.2.3"
    Start-Process ".\bin\logstash.bat" -ArgumentList "-f", "config\guardian-owl.conf" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Services started in background!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  • FastAPI:     http://localhost:5000" -ForegroundColor Cyan
Write-Host "  • Node.js API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Frontend:    http://localhost:8080" -ForegroundColor Cyan
Write-Host "  • Logstash:    http://localhost:5044" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, run: .\STOP_ALL.ps1" -ForegroundColor Yellow
Write-Host ""




