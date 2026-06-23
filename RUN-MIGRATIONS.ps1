# Run Database Migrations
# This creates all tables in AWS RDS

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
Write-Host ""

cd api

# AWS RDS connection string
$env:DATABASE_URL = "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"

Write-Host "Target database: AWS RDS (liteevent_production)" -ForegroundColor Yellow
Write-Host "Host: liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Yellow
Write-Host ""

npm run migrate

$EXIT_CODE = $LASTEXITCODE

Write-Host ""

if ($EXIT_CODE -eq 0) {
    Write-Host "✅ MIGRATIONS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your AWS database now has all tables!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1" -ForegroundColor White
    Write-Host "2. Click 'Update'" -ForegroundColor White
    Write-Host "3. Set 'Desired tasks' to 1" -ForegroundColor White
    Write-Host "4. Check 'Force new deployment'" -ForegroundColor White
    Write-Host "5. Click 'Update'" -ForegroundColor White
} else {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "This usually means:" -ForegroundColor Yellow
    Write-Host "1. RDS security group blocks your IP" -ForegroundColor White
    Write-Host "2. Password hasn't been applied yet (wait 2 minutes)" -ForegroundColor White
    Write-Host "3. Database doesn't exist" -ForegroundColor White
    Write-Host ""
    Write-Host "Fix options:" -ForegroundColor Yellow
    Write-Host "A. Update RDS security group to allow your IP" -ForegroundColor White
    Write-Host "B. Or proceed to start the service and migrations will run automatically" -ForegroundColor White
}

cd ..
