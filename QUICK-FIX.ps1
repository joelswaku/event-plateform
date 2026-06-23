# Quick Fix for AWS Database
# Run this with: .\QUICK-FIX.ps1

Write-Host "🚀 Quick Fix for AWS Database" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run migrations to create tables
Write-Host "Step 1: Running migrations to create database tables..." -ForegroundColor Yellow
cd api

$env:DATABASE_URL = "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"

try {
    npm run migrate
    Write-Host "✅ Migrations completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed. Checking if it's a network issue..." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see 'timeout' or 'connection refused':" -ForegroundColor Yellow
    Write-Host "1. Your RDS security group needs to allow your IP" -ForegroundColor White
    Write-Host "2. See setup-aws-database.md for instructions" -ForegroundColor White
    exit 1
}

cd ..

Write-Host ""
Write-Host "Step 2: Triggering new ECS deployment..." -ForegroundColor Yellow

try {
    aws ecs update-service `
        --cluster liteevent-production-cluster `
        --service liteevent-production-api-service `
        --force-new-deployment

    Write-Host "✅ Deployment triggered!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  AWS CLI not found. Deploy manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1" -ForegroundColor White
    Write-Host "2. Click 'Update' → Check 'Force new deployment' → Click 'Update'" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ DONE!" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor deployment:" -ForegroundColor Cyan
Write-Host "https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1" -ForegroundColor White
Write-Host ""
Write-Host "Check logs:" -ForegroundColor Cyan
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/`$252Fecs`$252Fliteevent-production`$252Fapi" -ForegroundColor White
