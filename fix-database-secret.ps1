# Fix Database Secret in Secrets Manager
# This updates the secret to match terraform.tfvars configuration

$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing Database Secret..." -ForegroundColor Cyan
Write-Host ""

# Configuration from terraform.tfvars
$DB_HOST = "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com"
$DB_PORT = "5432"
$DB_NAME = "liteevent_production"
$DB_USERNAME = "liteevent_admin"
$DB_PASSWORD = "LiteEvent2026Pass"

# Create the secret JSON
$SECRET_JSON = @{
    username = $DB_USERNAME
    password = $DB_PASSWORD
    host = $DB_HOST
    port = [int]$DB_PORT
    dbname = $DB_NAME
    url = "postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
} | ConvertTo-Json -Compress

Write-Host "Updating secret with:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  Username: $DB_USERNAME" -ForegroundColor White
Write-Host "  Password: LiteEvent2026Pass" -ForegroundColor White
Write-Host ""

# Update Secrets Manager
try {
    aws secretsmanager update-secret `
        --secret-id liteevent/production/database `
        --secret-string $SECRET_JSON

    Write-Host "✅ Secret updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update secret: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Now force new ECS deployment..." -ForegroundColor Yellow

try {
    aws ecs update-service `
        --cluster liteevent-production-cluster `
        --service liteevent-production-api-service `
        --force-new-deployment

    Write-Host "✅ Deployment triggered!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to trigger deployment: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Done! Monitor logs:" -ForegroundColor Green
Write-Host "aws logs tail /ecs/liteevent-production-api --follow" -ForegroundColor White
