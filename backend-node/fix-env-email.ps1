# Fix .env email configuration
$envFile = ".env"

Write-Host "`n=== Fixing Email Configuration ===" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Remove old email config
    $lines = Get-Content $envFile | Where-Object {
        $_ -notmatch '^SMTP_HOST='
        $_ -notmatch '^SMTP_PORT='
        $_ -notmatch '^SMTP_SECURE='
        $_ -notmatch '^SMTP_USER='
        $_ -notmatch '^SMTP_PASSWORD='
        $_ -notmatch '^SOC_EMAILS='
        $_ -notmatch '^#.*Gmail|Email|SMTP'
    }
    
    # Use salahezzat120@gmail.com for both (matching the app password account)
    $emailConfig = @"

# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=huxwkrhyskkzrdlfk
SOC_EMAILS=salahezzat120@gmail.com
"@
    
    $newContent = ($lines -join "`n") + $emailConfig
    Set-Content -Path $envFile -Value $newContent -NoNewline
    
    Write-Host "✓ Configuration updated!" -ForegroundColor Green
    Write-Host "  SMTP_USER: salahezzat120@gmail.com" -ForegroundColor White
    Write-Host "  SOC_EMAILS: salahezzat120@gmail.com" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  If authentication still fails, generate a NEW app password for salahezzat120@gmail.com" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
}

