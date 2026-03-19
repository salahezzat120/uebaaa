# Quick script to start Logstash for Guardian Owl
# Run this from the project root directory

Write-Host "Starting Logstash..." -ForegroundColor Green
Write-Host ""

cd logstash-9.2.3

Write-Host "Logstash will listen on port 5044" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop Logstash" -ForegroundColor Yellow
Write-Host ""

.\bin\logstash.bat -f config\guardian-owl.conf




