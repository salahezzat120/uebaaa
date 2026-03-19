# Guardian Owl - Start All Services Script
# This script starts all required services for the Guardian Owl UEBA system

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "========================================="
Write-ColorOutput Green "  Guardian Owl - Starting All Services  "
Write-ColorOutput Green "========================================="
Write-Host ""

# Get the script directory (project root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check if required directories exist
if (-not (Test-Path "backend-fastapi")) {
    Write-ColorOutput Red "❌ Error: backend-fastapi directory not found!"
    exit 1
}

if (-not (Test-Path "backend-node")) {
    Write-ColorOutput Red "❌ Error: backend-node directory not found!"
    exit 1
}

if (-not (Test-Path "logstash-9.2.3")) {
    Write-ColorOutput Yellow "⚠️  Warning: Logstash directory not found. Logstash will be skipped."
    $SkipLogstash = $true
} else {
    $SkipLogstash = $false
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

# Check if ports are already in use
Write-Host "Checking ports..." -ForegroundColor Cyan
if (Test-Port -Port 5000) {
    Write-ColorOutput Yellow "⚠️  Port 5000 (FastAPI) is already in use"
}
if (Test-Port -Port 3000) {
    Write-ColorOutput Yellow "⚠️  Port 3000 (Node.js) is already in use"
}
if (Test-Port -Port 8080) {
    Write-ColorOutput Yellow "⚠️  Port 8080 (Frontend) is already in use"
}
if (-not $SkipLogstash -and (Test-Port -Port 5044)) {
    Write-ColorOutput Yellow "⚠️  Port 5044 (Logstash) is already in use"
}
Write-Host ""

# Start FastAPI (Python)
Write-ColorOutput Cyan "1️⃣  Starting FastAPI (AI Model Service) on port 5000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend-fastapi'; Write-Host '🚀 FastAPI Server (Port 5000)' -ForegroundColor Green; python main.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Node.js Backend
Write-ColorOutput Cyan "2️⃣  Starting Node.js Backend on port 3000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend-node'; Write-Host '🚀 Node.js Backend (Port 3000)' -ForegroundColor Green; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Frontend (React/Vite)
Write-ColorOutput Cyan "3️⃣  Starting Frontend (React/Vite) on port 8080..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir'; Write-Host '🚀 Frontend (Port 8080)' -ForegroundColor Green; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Logstash (optional)
if (-not $SkipLogstash) {
    Write-ColorOutput Cyan "4️⃣  Starting Logstash on port 5044..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\logstash-9.2.3'; Write-Host '🚀 Logstash (Port 5044)' -ForegroundColor Green; .\bin\logstash.bat -f config\guardian-owl.conf" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-ColorOutput Green "========================================="
Write-ColorOutput Green "  ✅ All Services Started!"
Write-ColorOutput Green "========================================="
Write-Host ""
Write-Host "Services are running in separate windows:" -ForegroundColor White
Write-Host "  • FastAPI:     http://localhost:5000" -ForegroundColor Cyan
Write-Host "  • Node.js API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • Frontend:    http://localhost:8080" -ForegroundColor Cyan
if (-not $SkipLogstash) {
    Write-Host "  • Logstash:    http://localhost:5044" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the respective service." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop all services, close all the PowerShell windows that were opened." -ForegroundColor Yellow
Write-Host ""

# Wait a bit and check if services started successfully
Start-Sleep -Seconds 5
Write-Host "Checking service status..." -ForegroundColor Cyan
Write-Host ""

$servicesRunning = @{
    FastAPI = Test-Port -Port 5000
    NodeJS = Test-Port -Port 3000
    Frontend = Test-Port -Port 8080
}

if (-not $SkipLogstash) {
    $servicesRunning["Logstash"] = Test-Port -Port 5044
}

foreach ($service in $servicesRunning.GetEnumerator()) {
    if ($service.Value) {
        Write-ColorOutput Green "  ✅ $($service.Key): Running"
    } else {
        Write-ColorOutput Yellow "  ⚠️  $($service.Key): Not responding yet (may still be starting)"
    }
}

Write-Host ""
Write-Host "All services are starting. Give them a few seconds to fully initialize." -ForegroundColor Cyan
Write-Host ""




