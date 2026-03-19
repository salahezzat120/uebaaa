# Remove spaces from SMTP_PASSWORD in .env
$envFile = ".env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    # Replace password with spaces to password without spaces
    $newContent = $content -replace 'SMTP_PASSWORD=huxw krhy kkzr dlfk', 'SMTP_PASSWORD=huxwkrhyskkzrdlfk'
    Set-Content $envFile -Value $newContent -NoNewline
    Write-Host "Fixed! Removed spaces from password"
} else {
    Write-Host "Error: .env file not found"
}

