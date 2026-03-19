# Guardian Owl - Stop All Services Script
# This script stops all Guardian Owl services by killing processes on their ports

$ErrorActionPreference = "Continue"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Yellow "========================================="
Write-ColorOutput Yellow "  Guardian Owl - Stopping All Services  "
Write-ColorOutput Yellow "========================================="
Write-Host ""

function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            $processId = $connection.OwningProcess | Select-Object -Unique
            foreach ($pid in $processId) {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping $ServiceName (PID: $pid)..." -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-ColorOutput Green "  ✅ $ServiceName stopped"
                }
            }
        } else {
            Write-Host "$ServiceName is not running" -ForegroundColor Gray
        }
    } catch {
        Write-Host "$ServiceName: Could not determine status" -ForegroundColor Gray
    }
}

# Stop services
Stop-ProcessOnPort -Port 5000 -ServiceName "FastAPI (Port 5000)"
Start-Sleep -Milliseconds 500

Stop-ProcessOnPort -Port 3000 -ServiceName "Node.js Backend (Port 3000)"
Start-Sleep -Milliseconds 500

Stop-ProcessOnPort -Port 8080 -ServiceName "Frontend (Port 8080)"
Start-Sleep -Milliseconds 500

Stop-ProcessOnPort -Port 5044 -ServiceName "Logstash (Port 5044)"
Start-Sleep -Milliseconds 500

Write-Host ""
Write-ColorOutput Green "✅ All services stopped!"
Write-Host ""




