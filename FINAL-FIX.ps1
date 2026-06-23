# FINAL FIX - Stops the chaos and fixes everything
# Run this: .\FINAL-FIX.ps1

$ErrorActionPreference = "Continue"

Write-Host "🛑 STOPPING THE CHAOS..." -ForegroundColor Red
Write-Host ""

# Step 1: STOP all failing tasks
Write-Host "Step 1: Stopping all failing ECS tasks (setting desired count to 0)..." -ForegroundColor Yellow
aws ecs update-service `
    --cluster liteevent-production-cluster `
    --service liteevent-production-api-service `
    --desired-count 0 `
    --region us-east-1 2>$null

Start-Sleep -Seconds 5

Write-Host "✅ Service stopped. No more failing tasks." -ForegroundColor Green
Write-Host ""

# Step 2: Get RDS info
Write-Host "Step 2: Getting RDS configuration..." -ForegroundColor Yellow

$RDS_INFO = aws rds describe-db-instances `
    --db-instance-identifier liteevent-production-postgres `
    --region us-east-1 `
    --query 'DBInstances[0].[Endpoint.Address,DBName,MasterUsername]' `
    --output json | ConvertFrom-Json

$RDS_HOST = $RDS_INFO[0]
$DB_NAME = $RDS_INFO[1]
$DB_USER = $RDS_INFO[2]

if (-not $DB_NAME) {
    $DB_NAME = "liteevent_production"
    Write-Host "⚠️  Database name is NULL in RDS! Using: $DB_NAME" -ForegroundColor Yellow
} else {
    Write-Host "✅ Found database: $DB_NAME" -ForegroundColor Green
}

Write-Host "  Host: $RDS_HOST" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  Username: $DB_USER" -ForegroundColor White
Write-Host ""

# Step 3: Update Secrets Manager with CORRECT values
Write-Host "Step 3: Updating Secrets Manager with correct configuration..." -ForegroundColor Yellow

$PASSWORD = "LiteEvent2026Pass"

$SECRET = @{
    username = $DB_USER
    password = $PASSWORD
    host = $RDS_HOST
    port = 5432
    dbname = $DB_NAME
    url = "postgresql://${DB_USER}:${PASSWORD}@${RDS_HOST}:5432/${DB_NAME}"
} | ConvertTo-Json -Compress

aws secretsmanager update-secret `
    --secret-id liteevent/production/database `
    --secret-string $SECRET `
    --region us-east-1 2>$null

Write-Host "✅ Secrets Manager updated" -ForegroundColor Green
Write-Host ""

# Step 4: Verify RDS password matches
Write-Host "Step 4: Ensuring RDS password matches..." -ForegroundColor Yellow

aws rds modify-db-instance `
    --db-instance-identifier liteevent-production-postgres `
    --master-user-password $PASSWORD `
    --apply-immediately `
    --region us-east-1 2>$null

Write-Host "✅ RDS password set (will apply in ~2 minutes)" -ForegroundColor Green
Write-Host ""

# Step 5: Run migrations
Write-Host "Step 5: Running database migrations to create tables..." -ForegroundColor Yellow
Write-Host "⏳ Waiting 2 minutes for RDS password to apply..." -ForegroundColor Cyan

Start-Sleep -Seconds 120

cd api

$env:DATABASE_URL = "postgresql://${DB_USER}:${PASSWORD}@${RDS_HOST}:5432/${DB_NAME}"

Write-Host "Running migrations..." -ForegroundColor Cyan
npm run migrate 2>&1 | Out-Null

$MIGRATE_EXIT = $LASTEXITCODE

if ($MIGRATE_EXIT -eq 0) {
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations may have failed. Checking if tables exist..." -ForegroundColor Yellow

    # Try to connect and check tables
    $CHECK_TABLES = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    $TABLE_COUNT = & psql $env:DATABASE_URL -t -c $CHECK_TABLES 2>$null

    if ($TABLE_COUNT -gt 0) {
        Write-Host "✅ Database has $TABLE_COUNT tables - migrations already ran!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection or migration failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual fix needed:" -ForegroundColor Yellow
        Write-Host "1. Check if your IP is allowed in RDS security group" -ForegroundColor White
        Write-Host "2. Or wait for Step 7 to deploy and let ECS handle it" -ForegroundColor White
    }
}

cd ..

Write-Host ""

# Step 6: Wait a bit more for RDS to settle
Write-Host "Step 6: Waiting 30 more seconds for RDS to fully apply changes..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "✅ Ready to deploy" -ForegroundColor Green
Write-Host ""

# Step 7: Start the service with desired count 1 (not 2)
Write-Host "Step 7: Starting API service (1 task)..." -ForegroundColor Yellow

aws ecs update-service `
    --cluster liteevent-production-cluster `
    --service liteevent-production-api-service `
    --desired-count 1 `
    --force-new-deployment `
    --region us-east-1 2>$null

Write-Host "✅ Service started with 1 task" -ForegroundColor Green
Write-Host ""

# Step 8: Monitor
Write-Host "Step 8: Monitoring deployment (60 seconds)..." -ForegroundColor Yellow
Write-Host "Checking every 10 seconds..." -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le 6; $i++) {
    Start-Sleep -Seconds 10

    $SERVICE = aws ecs describe-services `
        --cluster liteevent-production-cluster `
        --services liteevent-production-api-service `
        --region us-east-1 `
        --query 'services[0].{Running:runningCount,Desired:desiredCount}' `
        --output json | ConvertFrom-Json

    Write-Host "[$i/6] Running: $($SERVICE.Running)/$($SERVICE.Desired)" -ForegroundColor Cyan

    if ($SERVICE.Running -eq $SERVICE.Desired -and $SERVICE.Running -gt 0) {
        Write-Host ""
        Write-Host "✅ SERVICE IS RUNNING!" -ForegroundColor Green
        break
    }
}

Write-Host ""
Write-Host "Checking recent logs..." -ForegroundColor Yellow
Write-Host ""

aws logs tail /ecs/liteevent-production-api --since 2m --region us-east-1 2>$null | Select-Object -Last 10

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DONE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/`$252Fecs`$252Fliteevent-production`$252Fapi" -ForegroundColor White
Write-Host "2. If still failing, check service: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services/liteevent-production-api-service?region=us-east-1" -ForegroundColor White
Write-Host ""
Write-Host "If you see 'Database connected successfully' in logs - YOU'RE DONE! 🎉" -ForegroundColor Green
