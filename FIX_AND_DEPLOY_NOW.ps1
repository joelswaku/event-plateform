# Fix Database Password and Deploy
Write-Host "Fixing database password and deploying..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Update Secrets Manager
Write-Host "1. Updating Secrets Manager password..." -ForegroundColor Yellow

$secretJson = @{
    username = "liteevent_admin"
    password = "LiteEvent2026Pass"
    host = "liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com"
    port = "5432"
    dbname = "liteevent_production"
    url = "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
} | ConvertTo-Json -Compress

aws secretsmanager update-secret --secret-id liteevent/production/database --secret-string $secretJson --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SUCCESS - Secrets Manager updated!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "   FAILED to update Secrets Manager!" -ForegroundColor Red
    exit 1
}

# Step 2: Verify
Write-Host "2. Verifying password..." -ForegroundColor Yellow
$currentSecret = aws secretsmanager get-secret-value --secret-id liteevent/production/database --query SecretString --output text --region us-east-1 | ConvertFrom-Json

if ($currentSecret.password -eq "LiteEvent2026Pass") {
    Write-Host "   SUCCESS - Password verified: $($currentSecret.password)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "   FAILED - Password is wrong: $($currentSecret.password)" -ForegroundColor Red
    exit 1
}

# Step 3: Restart ECS
Write-Host "3. Restarting API service..." -ForegroundColor Yellow

aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-api-service --force-new-deployment --region us-east-1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SUCCESS - API service restarting!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "   FAILED to restart service!" -ForegroundColor Red
    exit 1
}

# Step 4: Monitor deployment
Write-Host "4. Monitoring deployment (takes 2-3 minutes)..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 15
    $attempt++

    $service = aws ecs describe-services --cluster liteevent-production-cluster --services liteevent-production-api-service --region us-east-1 --query 'services[0]' | ConvertFrom-Json

    $running = $service.runningCount
    $desired = $service.desiredCount
    $pending = $service.pendingCount

    Write-Host "   [$attempt/$maxAttempts] Running: $running/$desired (Pending: $pending)" -ForegroundColor Cyan

    if ($running -eq $desired -and $running -gt 0) {
        Write-Host ""
        Write-Host "SUCCESS - DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host "   API is now running with $running tasks" -ForegroundColor Green
        Write-Host ""

        # Test the API
        Write-Host "5. Testing API..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health" -UseBasicParsing -TimeoutSec 10
            Write-Host "   SUCCESS - API Health Check: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
        } catch {
            Write-Host "   API not responding yet (wait 1-2 more minutes)" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run: .\CLOUDFLARE_SETUP.ps1" -ForegroundColor White
        Write-Host "  2. Wait 2 minutes for DNS" -ForegroundColor White
        Write-Host "  3. Run: .\TEST_DEPLOYMENT.ps1" -ForegroundColor White
        Write-Host "  4. Access: http://liteevent.com" -ForegroundColor White
        Write-Host ""

        exit 0
    }

    if ($attempt -eq $maxAttempts) {
        Write-Host ""
        Write-Host "DEPLOYMENT TIMEOUT!" -ForegroundColor Red
        Write-Host "Checking logs..." -ForegroundColor Yellow
        Write-Host ""

        aws logs tail /ecs/liteevent-production/api --since 5m --format short --region us-east-1

        exit 1
    }
}
