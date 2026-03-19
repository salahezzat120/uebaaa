# Test Activity Logs API
# This script tests if the activity logs API is working

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Testing Activity Logs API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

Write-Host "1. Testing GET /api/activity (all logs)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/activity" -Method Get -ErrorAction Stop
    Write-Host "   ✅ API is working!" -ForegroundColor Green
    Write-Host "   Total logs: $($response.Count)" -ForegroundColor Cyan
    
    if ($response.Count -gt 0) {
        Write-Host "   Sample log:" -ForegroundColor Cyan
        Write-Host "     Action: $($response[0].action)" -ForegroundColor White
        Write-Host "     Actor: $($response[0].actor)" -ForegroundColor White
        Write-Host "     Type: $($response[0].type)" -ForegroundColor White
        Write-Host "     Status: $($response[0].status)" -ForegroundColor White
        Write-Host "     Created: $($response[0].created_at)" -ForegroundColor White
    } else {
        Write-Host "   ℹ️  No logs yet. Perform some actions (update alert, connect data source, etc.) to create logs." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the backend is running on $baseUrl" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "2. Testing GET /api/activity?type=alert..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/activity?type=alert" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Filter by type is working!" -ForegroundColor Green
    Write-Host "   Alert logs: $($response.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. Testing GET /api/activity?status=success..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/activity?status=success" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Filter by status is working!" -ForegroundColor Green
    Write-Host "   Success logs: $($response.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "4. Testing GET /api/activity?search=alert..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/activity?search=alert" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Search is working!" -ForegroundColor Green
    Write-Host "   Search results: $($response.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed (✅), the Activity Logs API is working!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure database migration is applied (004_activity_logs.sql)" -ForegroundColor White
Write-Host "  2. Perform some actions in the app (update alert, connect data source, etc.)" -ForegroundColor White
Write-Host "  3. Check the Activity Logs page in the frontend" -ForegroundColor White
Write-Host ""



