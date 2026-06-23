# Complete Fix Script - Updates task definition with REDIS_URL and deploys

Write-Host "Starting complete fix..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Taint task definition to force recreation
Write-Host "1. Tainting task definition..." -ForegroundColor Yellow
cd C:\projects\event-plateform\terraform\environments\production
terraform taint 'module.ecs.aws_ecs_task_definition.api'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to taint!" -ForegroundColor Red
    exit 1
}

Write-Host "   SUCCESS" -ForegroundColor Green
Write-Host ""

# Step 2: Apply Terraform to create new revision with REDIS_URL
Write-Host "2. Creating new task definition with REDIS_URL..." -ForegroundColor Yellow
terraform apply -auto-approve

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to apply!" -ForegroundColor Red
    exit 1
}

Write-Host "   SUCCESS" -ForegroundColor Green
Write-Host ""

# Step 3: Force new deployment to use new task definition
Write-Host "3. Deploying new task definition..." -ForegroundColor Yellow
aws ecs update-service `
  --cluster liteevent-production-cluster `
  --service liteevent-production-api-service `
  --force-new-deployment `
  --region us-east-1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy!" -ForegroundColor Red
    exit 1
}

Write-Host "   SUCCESS" -ForegroundColor Green
Write-Host ""

# Step 4: Monitor deployment
Write-Host "4. Monitoring deployment..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 20
    $attempt++

    $service = aws ecs describe-services `
      --cluster liteevent-production-cluster `
      --services liteevent-production-api-service `
      --region us-east-1 `
      --query 'services[0]' | ConvertFrom-Json

    $running = $service.runningCount
    $desired = $service.desiredCount

    Write-Host "   [$attempt/$maxAttempts] Running: $running/$desired" -ForegroundColor Cyan

    if ($running -eq $desired -and $running -gt 0) {
        Write-Host ""
        Write-Host "SUCCESS! API is running!" -ForegroundColor Green
        Write-Host ""

        # Wait a bit for health checks
        Start-Sleep -Seconds 10

        # Test API
        Write-Host "5. Testing API..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health" -UseBasicParsing -TimeoutSec 10
            Write-Host "   API Health: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "   API: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   (May need a few more minutes)" -ForegroundColor Gray
            Write-Host ""
        }

        Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Setup Cloudflare DNS (.\CLOUDFLARE_SETUP.ps1)" -ForegroundColor White
        Write-Host "  2. Test deployment (.\TEST_DEPLOYMENT.ps1)" -ForegroundColor White
        Write-Host ""

        exit 0
    }
}

Write-Host ""
Write-Host "TIMEOUT - Tasks not starting!" -ForegroundColor Red
Write-Host "Checking logs..." -ForegroundColor Yellow
Write-Host ""

# Get latest task
$tasks = aws ecs list-tasks `
  --cluster liteevent-production-cluster `
  --service-name liteevent-production-api-service `
  --desired-status STOPPED `
  --region us-east-1 `
  --query 'taskArns[0]' `
  --output text

if ($tasks -and $tasks -ne "None") {
    $taskId = $tasks.Split('/')[-1]
    Write-Host "Latest stopped task: $taskId" -ForegroundColor Yellow

    aws ecs describe-tasks `
      --cluster liteevent-production-cluster `
      --tasks $taskId `
      --region us-east-1 `
      --query 'tasks[0].{StoppedReason:stoppedReason,Containers:containers[*].[name,exitCode,reason]}'
}

exit 1
