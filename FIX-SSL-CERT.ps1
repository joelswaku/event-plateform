Write-Host "Fixing SSL Certificate Issue..." -ForegroundColor Cyan
Write-Host ""

$newSecretValue = @'
{
  "username": "liteevent_admin",
  "password": "LiteEvent2026Pass",
  "host": "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "liteevent_production",
  "url": "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production?sslmode=no-verify"
}
'@

Write-Host "Copy this JSON and paste it into AWS Secrets Manager:" -ForegroundColor Yellow
Write-Host ""
Write-Host $newSecretValue -ForegroundColor Green
Write-Host ""
Write-Host "Opening AWS Secrets Manager..." -ForegroundColor Cyan

Start-Process "https://console.aws.amazon.com/secretsmanager/secret?name=liteevent%2Fproduction%2Fdatabase&region=us-east-1"

Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "1. Click 'Retrieve secret value'" -ForegroundColor White
Write-Host "2. Click 'Edit'" -ForegroundColor White
Write-Host "3. Select 'Plaintext' tab" -ForegroundColor White
Write-Host "4. Replace ALL content with the JSON above" -ForegroundColor White
Write-Host "5. Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "KEY CHANGE: sslmode=require -> sslmode=no-verify" -ForegroundColor Cyan

Set-Clipboard -Value $newSecretValue
Write-Host "JSON copied to clipboard!" -ForegroundColor Green
