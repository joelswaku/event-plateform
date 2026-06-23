# Fix Production Database Connection
# Run this script from a machine with AWS CLI configured

Write-Host "🔧 Fixing Production Database Connection..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Get RDS Endpoint
Write-Host "1. Getting RDS endpoint..." -ForegroundColor Yellow
$RDS_ENDPOINT = aws rds describe-db-instances `
  --db-instance-identifier liteevent-production-postgres `
  --query 'DBInstances[0].Endpoint.Address' `
  --output text

if ($RDS_ENDPOINT) {
    Write-Host "   ✅ RDS Endpoint: $RDS_ENDPOINT" -ForegroundColor Green
} else {
    Write-Host "   ❌ Could not get RDS endpoint!" -ForegroundColor Red
    exit 1
}

# Step 2: Update Secrets Manager
Write-Host ""
Write-Host "2. Updating Secrets Manager..." -ForegroundColor Yellow

$SECRET_JSON = @"
{
  \"username\": \"liteevent_admin\",
  \"password\": \"Liteeventswama\",
  \"engine\": \"postgres\",
  \"host\": \"$RDS_ENDPOINT\",
  \"port\": 5432,
  \"dbname\": \"liteevent_production\",
  \"url\": \"postgresql://liteevent_admin:Liteeventswama@$RDS_ENDPOINT:5432/liteevent_production\"
}
"@

aws secretsmanager update-secret `
  --secret-id liteevent/production/database `
  --secret-string $SECRET_JSON

Write-Host "   ✅ Secrets Manager updated" -ForegroundColor Green

# Step 3: Check if RDS password is pending
Write-Host ""
Write-Host "3. Checking RDS password status..." -ForegroundColor Yellow
$PENDING = aws rds describe-db-instances `
  --db-instance-identifier liteevent-production-postgres `
  --query 'DBInstances[0].PendingModifiedValues' `
  --output json | ConvertFrom-Json

if ($PENDING.MasterUserPassword) {
    Write-Host "   ⚠️  Password change is PENDING - applying now..." -ForegroundColor Yellow

    aws rds modify-db-instance `
      --db-instance-identifier liteevent-production-postgres `
      --master-user-password Liteeventswama `
      --apply-immediately

    Write-Host "   ⏳ Waiting 2 minutes for password to apply..." -ForegroundColor Yellow
    Start-Sleep -Seconds 120

    Write-Host "   ✅ Password applied" -ForegroundColor Green
} else {
    Write-Host "   ✅ RDS password is already active" -ForegroundColor Green
}

# Step 4: Force new ECS deployment
Write-Host ""
Write-Host "4. Restarting API service..." -ForegroundColor Yellow
aws ecs update-service `
  --cluster liteevent-production-cluster `
  --service liteevent-production-api-service `
  --force-new-deployment

Write-Host "   ✅ Deployment triggered" -ForegroundColor Green

# Step 5: Wait and monitor
Write-Host ""
Write-Host "5. Monitoring deployment..." -ForegroundColor Yellow
Write-Host "   ⏳ Waiting 60 seconds for container to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

# Check service status
$SERVICE = aws ecs describe-services `
  --cluster liteevent-production-cluster `
  --services liteevent-production-api-service `
  --query 'services[0].{Running:runningCount,Desired:desiredCount}' `
  --output json | ConvertFrom-Json

Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "   Running: $($SERVICE.Running)/$($SERVICE.Desired)" -ForegroundColor White

# Check logs
Write-Host ""
Write-Host "📜 Recent Logs:" -ForegroundColor Cyan
aws logs tail /ecs/liteevent-production-api --since 2m 2>$null | Select-Object -Last 10

Write-Host ""
Write-Host "✅ DONE!" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor logs with:" -ForegroundColor Yellow
Write-Host "aws logs tail /ecs/liteevent-production-api --follow" -ForegroundColor White
Write-Host ""
Write-Host "Check status with:" -ForegroundColor Yellow
Write-Host "aws ecs describe-services --cluster liteevent-production-cluster --services liteevent-production-api-service" -ForegroundColor White
