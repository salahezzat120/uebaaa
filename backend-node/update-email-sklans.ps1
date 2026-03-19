# Update email configuration to use sklans120@gmail.com
$envFile = ".env"
$email = "sklans120@gmail.com"
$password = "dincvxngaqrlhzgm"

Write-Host "`n=== Updating Email Configuration ===" -ForegroundColor Cyan
Write-Host "Email: $email" -ForegroundColor Green
Write-Host ""

if (Test-Path $envFile) {
    # Read current content
    $lines = Get-Content $envFile
    
    # Remove old email config lines
    $cleanLines = $lines | Where-Object {
        $_ -notmatch '^SMTP_HOST='
        $_ -notmatch '^SMTP_PORT='
        $_ -notmatch '^SMTP_SECURE='
        $_ -notmatch '^SMTP_USER='
        $_ -notmatch '^SMTP_PASSWORD='
        $_ -notmatch '^SOC_EMAILS='
        $_ -notmatch '^#.*Gmail|Email'
    }
    
    # Add new email config
    $emailConfig = @"

# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$email
SMTP_PASSWORD=$password
SOC_EMAILS=$email
"@
    
    # Write back
    $newContent = ($cleanLines -join "`n") + $emailConfig
    Set-Content -Path $envFile -Value $newContent
    
    Write-Host "✓ Email configuration updated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  SMTP_USER=$email" -ForegroundColor White
    Write-Host "  SMTP_PASSWORD=$password" -ForegroundColor White
    Write-Host "  SOC_EMAILS=$email" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "Creating new .env file..." -ForegroundColor Yellow
    
    $emailConfig = @"
# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$email
SMTP_PASSWORD=$password
SOC_EMAILS=$email
"@
    
    Set-Content -Path $envFile -Value $emailConfig
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

Write-Host "✓ Done! Now run: node test-email.js" -ForegroundColor Green
Write-Host ""

