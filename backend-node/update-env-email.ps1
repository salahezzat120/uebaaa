# PowerShell script to add email configuration to .env file
$envFile = ".env"
$appPassword = "dincvxngaqrlhzgm"  # App password with spaces removed

Write-Host "`n=== Updating .env file with Gmail configuration ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path $envFile) {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    # Read existing content
    $content = Get-Content $envFile -Raw
    
    # Remove old email settings if they exist
    $lines = Get-Content $envFile | Where-Object {
        $_ -notmatch '^SMTP_HOST='
        $_ -notmatch '^SMTP_PORT='
        $_ -notmatch '^SMTP_SECURE='
        $_ -notmatch '^SMTP_USER='
        $_ -notmatch '^SMTP_PASSWORD='
        $_ -notmatch '^SOC_EMAILS='
        $_ -notmatch '^FRONTEND_URL='
    }
    
    # Add email configuration
    $emailConfig = @"

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=$appPassword
SOC_EMAILS=salahezzat120@gmail.com
FRONTEND_URL=http://localhost:5173
"@
    
    # Combine and write
    $newContent = ($lines -join "`n") + "`n" + $emailConfig
    Set-Content -Path $envFile -Value $newContent
    
    Write-Host "✓ Email configuration added to .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration added:" -ForegroundColor Yellow
    Write-Host "  SMTP_USER=salahezzat120@gmail.com" -ForegroundColor White
    Write-Host "  SMTP_PASSWORD=$appPassword" -ForegroundColor White
    Write-Host "  SOC_EMAILS=salahezzat120@gmail.com" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "⚠ .env file not found. Creating new one..." -ForegroundColor Yellow
    
    $emailConfig = @"
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=$appPassword
SOC_EMAILS=salahezzat120@gmail.com
FRONTEND_URL=http://localhost:5173
"@
    
    Set-Content -Path $envFile -Value $emailConfig
    Write-Host "✓ Created .env file with email configuration" -ForegroundColor Green
}

Write-Host "✓ Done! You can now test with: node test-email.js" -ForegroundColor Green
Write-Host ""

