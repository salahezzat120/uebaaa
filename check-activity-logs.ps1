# Quick check for Activity Logs status
Write-Host "Checking Activity Logs Status..." -ForegroundColor Cyan
Write-Host ""

# Check if API is responding
Write-Host "1. Testing API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/activity" -Method Get -ErrorAction Stop
    Write-Host "   ✅ API is working!" -ForegroundColor Green
    Write-Host "   Total logs in database: $($response.Count)" -ForegroundColor Cyan
    
    if ($response.Count -eq 0) {
        Write-Host ""
        Write-Host "   ⚠️  No logs found. Possible reasons:" -ForegroundColor Yellow
        Write-Host "      - Database migration not applied yet" -ForegroundColor White
        Write-Host "      - No actions performed yet that create logs" -ForegroundColor White
        Write-Host "      - Activity logging errors (check backend console)" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "   Recent logs:" -ForegroundColor Cyan
        $response | Select-Object -First 3 | ForEach-Object {
            Write-Host "     • $($_.action) - $($_.actor) - $($_.created_at)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure backend is running on http://localhost:3000" -ForegroundColor Yellow
}
Write-Host ""

# Check if table exists (by trying a simple query)
Write-Host "2. Check backend console for activity logging errors..." -ForegroundColor Yellow
Write-Host "   Look for messages like:" -ForegroundColor White
Write-Host "     [Activity Logger] Error creating activity log: ..." -ForegroundColor Gray
Write-Host ""

Write-Host "3. If no logs appear, check:" -ForegroundColor Yellow
Write-Host "   a) Run database migration: supabase/migrations/004_activity_logs.sql" -ForegroundColor White
Write-Host "   b) Perform an action (toggle model, update alert, etc.)" -ForegroundColor White
Write-Host "   c) Check backend console for errors" -ForegroundColor White
Write-Host ""



