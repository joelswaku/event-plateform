# ============================================================================
# Production Deployment Diagnostics
# ============================================================================
# This script checks the health of your production deployment on AWS
# Run this to diagnose the 502 Bad Gateway error

Write-Host "🔍 LiteEvent Production Diagnostics" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$Region = "us-east-1"
$Cluster = "liteevent-production-cluster"
$ApiService = "liteevent-production-api-service"
$WebService = "liteevent-production-web-service"
$VendorsService = "liteevent-production-vendors-service"

# ============================================================================
# 1. Check ECS Service Status
# ============================================================================
Write-Host "📦 Checking ECS Services..." -ForegroundColor Yellow

Write-Host "`n🔹 API Service:"
aws ecs describe-services `
  --cluster $Cluster `
  --services $ApiService `
  --region $Region `
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' `
  --output table

Write-Host "`n🔹 Web Service:"
aws ecs describe-services `
  --cluster $Cluster `
  --services $WebService `
  --region $Region `
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' `
  --output table

Write-Host "`n🔹 Vendors Service:"
aws ecs describe-services `
  --cluster $Cluster `
  --services $VendorsService `
  --region $Region `
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' `
  --output table

# ============================================================================
# 2. Check Recent Tasks (including STOPPED tasks)
# ============================================================================
Write-Host "`n`n🔍 Checking Recent API Tasks (including failed ones)..." -ForegroundColor Yellow

$RecentTasks = aws ecs list-tasks `
  --cluster $Cluster `
  --service-name $ApiService `
  --region $Region `
  --desired-status STOPPED `
  --max-items 5 `
  --query 'taskArns[0]' `
  --output text

if ($RecentTasks -and $RecentTasks -ne "None") {
    Write-Host "`n🔹 Most Recent Stopped Task Details:"
    aws ecs describe-tasks `
      --cluster $Cluster `
      --tasks $RecentTasks `
      --region $Region `
      --query 'tasks[0].{TaskARN:taskArn,LastStatus:lastStatus,StoppedReason:stoppedReason,StopCode:stopCode}' `
      --output table

    Write-Host "`n📋 Container Details:"
    aws ecs describe-tasks `
      --cluster $Cluster `
      --tasks $RecentTasks `
      --region $Region `
      --query 'tasks[0].containers[0].{Name:name,LastStatus:lastStatus,ExitCode:exitCode,Reason:reason}' `
      --output table
} else {
    Write-Host "No stopped tasks found (this is actually good!)" -ForegroundColor Green
}

# ============================================================================
# 3. Check Running Tasks
# ============================================================================
Write-Host "`n`n🟢 Checking Running API Tasks..." -ForegroundColor Yellow

$RunningTasks = aws ecs list-tasks `
  --cluster $Cluster `
  --service-name $ApiService `
  --region $Region `
  --desired-status RUNNING `
  --query 'taskArns[0]' `
  --output text

if ($RunningTasks -and $RunningTasks -ne "None") {
    Write-Host "✅ Found running task: $RunningTasks"

    Write-Host "`n📋 Task Health:"
    aws ecs describe-tasks `
      --cluster $Cluster `
      --tasks $RunningTasks `
      --region $Region `
      --query 'tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,DesiredStatus:desiredStatus}' `
      --output table
} else {
    Write-Host "❌ No running tasks found! This is the problem." -ForegroundColor Red
}

# ============================================================================
# 4. Check CloudWatch Logs (Last 20 lines)
# ============================================================================
Write-Host "`n`n📜 Recent API Logs (last 20 lines)..." -ForegroundColor Yellow

$LogGroup = "/ecs/liteevent-production/api"
$LatestStream = aws logs describe-log-streams `
  --log-group-name $LogGroup `
  --order-by LastEventTime `
  --descending `
  --max-items 1 `
  --region $Region `
  --query 'logStreams[0].logStreamName' `
  --output text 2>$null

if ($LatestStream -and $LatestStream -ne "None") {
    Write-Host "📂 Log Stream: $LatestStream`n"

    aws logs tail $LogGroup `
      --follow `
      --since 10m `
      --region $Region `
      --format short 2>$null | Select-Object -Last 30
} else {
    Write-Host "⚠️  No logs found. Container might not be starting at all." -ForegroundColor Red
}

# ============================================================================
# 5. Check Target Group Health
# ============================================================================
Write-Host "`n`n🎯 Checking Target Group Health..." -ForegroundColor Yellow

$TargetGroups = aws elbv2 describe-target-groups `
  --region $Region `
  --query 'TargetGroups[?starts_with(TargetGroupName, `liteevent-production`)].TargetGroupArn' `
  --output text

if ($TargetGroups) {
    foreach ($TG in $TargetGroups -split '\s+') {
        if ($TG) {
            $TGName = aws elbv2 describe-target-groups `
              --target-group-arns $TG `
              --region $Region `
              --query 'TargetGroups[0].TargetGroupName' `
              --output text

            Write-Host "`n🔹 Target Group: $TGName"
            aws elbv2 describe-target-health `
              --target-group-arn $TG `
              --region $Region `
              --query 'TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason,Description:TargetHealth.Description}' `
              --output table
        }
    }
} else {
    Write-Host "❌ Could not find target groups" -ForegroundColor Red
}

# ============================================================================
# 6. Check Secrets Manager
# ============================================================================
Write-Host "`n`n🔐 Checking Secrets Manager..." -ForegroundColor Yellow

$Secrets = @(
    "liteevent/production/database",
    "liteevent/production/jwt",
    "liteevent/production/stripe",
    "liteevent/production/google-oauth"
)

foreach ($SecretName in $Secrets) {
    $SecretExists = aws secretsmanager describe-secret `
      --secret-id $SecretName `
      --region $Region `
      --query 'Name' `
      --output text 2>$null

    if ($SecretExists) {
        Write-Host "✅ $SecretName" -ForegroundColor Green
    } else {
        Write-Host "❌ $SecretName - MISSING!" -ForegroundColor Red
    }
}

# ============================================================================
# 7. Test ALB Endpoint
# ============================================================================
Write-Host "`n`n🌐 Testing ALB Endpoint..." -ForegroundColor Yellow

$AlbUrl = "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com"

Write-Host "`n🔹 Testing: $AlbUrl/health"
try {
    $Response = Invoke-WebRequest -Uri "$AlbUrl/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Health check passed! Status: $($Response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($Response.Content)"
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    }
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n🔍 Check the output above for:"
Write-Host "  1. ❌ Red errors - these are your problems"
Write-Host "  2. 📜 Error messages in logs"
Write-Host "  3. 🎯 Unhealthy targets in target groups"
Write-Host "  4. 🔐 Missing secrets"
Write-Host "`n💡 Common Issues:"
Write-Host "  • Container exits immediately = check logs for startup errors"
Write-Host "  • No running tasks = container crashing on startup"
Write-Host "  • Unhealthy targets = health check failing"
Write-Host "  • Database connection errors = check RDS and security groups"
Write-Host "  • Missing secrets = deployment will fail"

Write-Host "`n🆘 Next Steps:"
Write-Host "  1. Look for ERROR messages in the logs above"
Write-Host "  2. Check stopped task 'StoppedReason'"
Write-Host "  3. Share any error messages with Claude"

Write-Host "`n" -NoNewline
