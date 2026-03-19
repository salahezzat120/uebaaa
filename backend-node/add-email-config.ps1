# PowerShell script to add email configuration to .env file
$envFile = ".env"
$appPassword = "dincvxngaqrlhzgm"

Write-Host "`n=== Adding Email Configuration to .env ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path $envFile) {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    # Read all lines
    $lines = Get-Content $envFile
    
    # Check what's already there
    $hasSmtpHost = $lines | Where-Object { $_ -match "^SMTP_HOST=" }
    $hasSmtpUser = $lines | Where-Object { $_ -match "^SMTP_USER=" }
    $hasSmtpPassword = $lines | Where-Object { $_ -match "^SMTP_PASSWORD=" }
    
    # Remove existing email config lines
    $cleanLines = $lines | Where-Object {
        $_ -notmatch '^SMTP_HOST='
        $_ -notmatch '^SMTP_PORT='
        $_ -notmatch '^SMTP_SECURE='
        $_ -notmatch '^SMTP_USER='
        $_ -notmatch '^SMTP_PASSWORD='
        $_ -notmatch '^SOC_EMAILS='
    }
    
    # Add email configuration
    $emailConfig = @"

# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=$appPassword
SOC_EMAILS=salahezzat120@gmail.com
"@
    
    # Combine and write
    $newContent = ($cleanLines -join "`n") + "`n" + $emailConfig
    Set-Content -Path $envFile -Value $newContent -NoNewline
    
    Write-Host "✓ Email configuration added/updated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  SMTP_USER=salahezzat120@gmail.com" -ForegroundColor White
    Write-Host "  SMTP_PASSWORD=$appPassword" -ForegroundColor White
    Write-Host "  SOC_EMAILS=salahezzat120@gmail.com" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "⚠ .env file not found. Creating new one..." -ForegroundColor Yellow
    
    $emailConfig = @"
# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=$appPassword
SOC_EMAILS=salahezzat120@gmail.com
"@
    
    Set-Content -Path $envFile -Value $emailConfig -NoNewline
    Write-Host "✓ Created .env file with email configuration" -ForegroundColor Green
}

Write-Host "✓ Done! Now run: node test-email.js" -ForegroundColor Green
Write-Host ""

