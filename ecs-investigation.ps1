# ECS Service Investigation Script (PowerShell)
# Run this to gather diagnostic data

$Region = "us-east-1"
$Cluster = "liteevent-production-cluster"
$Service = "liteevent-production-api-service"
$TaskDef = "liteevent-production-api-task:1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ECS SERVICE INVESTIGATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Get Service Details
Write-Host "1. SERVICE DETAILS" -ForegroundColor Yellow
Write-Host "==================="
$ServiceDetails = aws ecs describe-services `
  --cluster $Cluster `
  --services $Service `
  --region $Region `
  --output json | ConvertFrom-Json

Write-Host "Status: $($ServiceDetails.services[0].status)"
Write-Host "Running Count: $($ServiceDetails.services[0].runningCount)"
Write-Host "Desired Count: $($ServiceDetails.services[0].desiredCount)"
Write-Host "Pending Count: $($ServiceDetails.services[0].pendingCount)"

if ($ServiceDetails.services[0].events) {
    Write-Host "`nRecent Events:"
    $ServiceDetails.services[0].events | Select-Object -First 5 | ForEach-Object {
        Write-Host "  [$($_.createdAt)] $($_.message)"
    }
}

Write-Host ""
Write-Host "2. RECENT STOPPED TASKS" -ForegroundColor Yellow
Write-Host "========================="
$StoppedTaskArns = aws ecs list-tasks `
  --cluster $Cluster `
  --service-name $Service `
  --desired-status STOPPED `
  --region $Region `
  --max-items 5 `
  --query 'taskArns' `
  --output json | ConvertFrom-Json

if ($StoppedTaskArns -and $StoppedTaskArns.Count -gt 0) {
    $StoppedTask = aws ecs describe-tasks `
      --cluster $Cluster `
      --tasks $StoppedTaskArns[0] `
      --region $Region `
      --output json | ConvertFrom-Json

    Write-Host "Task ARN: $($StoppedTaskArns[0])"
    Write-Host "Stopped Reason: $($StoppedTask.tasks[0].stoppedReason)"
    Write-Host "Stop Code: $($StoppedTask.tasks[0].stopCode)"

    if ($StoppedTask.tasks[0].containers) {
        Write-Host "`nContainer Details:"
        $StoppedTask.tasks[0].containers | ForEach-Object {
            Write-Host "  Name: $($_.name)"
            Write-Host "  Last Status: $($_.lastStatus)"
            Write-Host "  Exit Code: $($_.exitCode)"
            Write-Host "  Reason: $($_.reason)"
        }
    }
} else {
    Write-Host "No stopped tasks found"
}

Write-Host ""
Write-Host "3. RUNNING TASKS" -ForegroundColor Yellow
Write-Host "================"
$RunningTaskArns = aws ecs list-tasks `
  --cluster $Cluster `
  --service-name $Service `
  --desired-status RUNNING `
  --region $Region `
  --query 'taskArns' `
  --output json | ConvertFrom-Json

if ($RunningTaskArns -and $RunningTaskArns.Count -gt 0) {
    Write-Host "Found $($RunningTaskArns.Count) running task(s)"
    $RunningTask = aws ecs describe-tasks `
      --cluster $Cluster `
      --tasks $RunningTaskArns[0] `
      --region $Region `
      --output json | ConvertFrom-Json

    Write-Host "Health Status: $($RunningTask.tasks[0].healthStatus)"
    Write-Host "Last Status: $($RunningTask.tasks[0].lastStatus)"
} else {
    Write-Host "❌ No running tasks found - THIS IS THE PROBLEM!" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. CLOUDWATCH LOGS (Last 50 lines)" -ForegroundColor Yellow
Write-Host "==================================="
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
    Write-Host "Log stream: $LatestStream"
    Write-Host ""

    $LogEvents = aws logs get-log-events `
      --log-group-name $LogGroup `
      --log-stream-name $LatestStream `
      --limit 50 `
      --region $Region `
      --output json 2>$null | ConvertFrom-Json

    if ($LogEvents.events) {
        $LogEvents.events | ForEach-Object {
            $msg = $_.message
            if ($msg -match "ERROR") {
                Write-Host $msg -ForegroundColor Red
            } elseif ($msg -match "WARN") {
                Write-Host $msg -ForegroundColor Yellow
            } else {
                Write-Host $msg
            }
        }
    }
} else {
    Write-Host "❌ No log streams found - Container never started" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. TARGET GROUP HEALTH" -ForegroundColor Yellow
Write-Host "======================"
$TargetGroups = aws elbv2 describe-target-groups `
  --region $Region `
  --output json 2>$null | ConvertFrom-Json

$ApiTG = $TargetGroups.TargetGroups | Where-Object { $_.TargetGroupName -like "*api*" }

if ($ApiTG) {
    foreach ($TG in $ApiTG) {
        Write-Host "`nTarget Group: $($TG.TargetGroupName)"
        $Health = aws elbv2 describe-target-health `
          --target-group-arn $TG.TargetGroupArn `
          --region $Region `
          --output json | ConvertFrom-Json

        if ($Health.TargetHealthDescriptions.Count -eq 0) {
            Write-Host "  ❌ No registered targets" -ForegroundColor Red
        } else {
            $Health.TargetHealthDescriptions | ForEach-Object {
                $state = $_.TargetHealth.State
                $color = if ($state -eq "healthy") { "Green" } else { "Red" }
                Write-Host "  Target: $($_.Target.Id):$($_.Target.Port)" -ForegroundColor $color
                Write-Host "    State: $state" -ForegroundColor $color
                Write-Host "    Reason: $($_.TargetHealth.Reason)"
                Write-Host "    Description: $($_.TargetHealth.Description)"
            }
        }
    }
}

Write-Host ""
Write-Host "6. RDS & SECURITY GROUPS" -ForegroundColor Yellow
Write-Host "========================"
$RDSInstances = aws rds describe-db-instances `
  --region $Region `
  --output json 2>$null | ConvertFrom-Json

$ProdDB = $RDSInstances.DBInstances | Where-Object { $_.DBInstanceIdentifier -like "*liteevent*production*" }

if ($ProdDB) {
    Write-Host "RDS Instance: $($ProdDB.DBInstanceIdentifier)"
    Write-Host "Endpoint: $($ProdDB.Endpoint.Address)"
    Write-Host "Port: $($ProdDB.Endpoint.Port)"
    Write-Host "Status: $($ProdDB.DBInstanceStatus)"

    $RDSSG = $ProdDB.VpcSecurityGroups[0].VpcSecurityGroupId
    Write-Host "`nRDS Security Group: $RDSSG"

    # Get ECS Security Group
    $SecurityGroups = aws ec2 describe-security-groups `
      --region $Region `
      --output json | ConvertFrom-Json

    $ECSSG = $SecurityGroups.SecurityGroups | Where-Object { $_.GroupName -like "*ecs-tasks*" -and $_.GroupName -like "*production*" }

    if ($ECSSG) {
        Write-Host "ECS Security Group: $($ECSSG.GroupId) ($($ECSSG.GroupName))"

        # Check if RDS allows ECS
        $RDSSGDetails = $SecurityGroups.SecurityGroups | Where-Object { $_.GroupId -eq $RDSSG }
        Write-Host "`nRDS Inbound Rules:"

        $HasPostgresRule = $false
        foreach ($rule in $RDSSGDetails.IpPermissions) {
            if ($rule.FromPort -eq 5432) {
                $HasPostgresRule = $true
                Write-Host "  ✅ PostgreSQL (5432) allowed from:"
                foreach ($sg in $rule.UserIdGroupPairs) {
                    Write-Host "    - $($sg.GroupId)"
                    if ($sg.GroupId -eq $ECSSG.GroupId) {
                        Write-Host "      ✅ MATCHES ECS Security Group" -ForegroundColor Green
                    }
                }
            }
        }

        if (-not $HasPostgresRule) {
            Write-Host "  ❌ NO PostgreSQL rule found - THIS IS A PROBLEM!" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "7. SECRETS MANAGER" -ForegroundColor Yellow
Write-Host "=================="
$Secrets = @(
    "liteevent/production/database",
    "liteevent/production/jwt",
    "liteevent/production/stripe",
    "liteevent/production/google-oauth"
)

foreach ($SecretName in $Secrets) {
    try {
        $SecretInfo = aws secretsmanager describe-secret `
          --secret-id $SecretName `
          --region $Region `
          --output json 2>$null | ConvertFrom-Json

        Write-Host "✅ $SecretName" -ForegroundColor Green
        Write-Host "   Last Changed: $($SecretInfo.LastChangedDate)"
    } catch {
        Write-Host "❌ $SecretName - NOT FOUND" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "8. TASK DEFINITION CONFIGURATION" -ForegroundColor Yellow
Write-Host "================================="
$TaskDefDetails = aws ecs describe-task-definition `
  --task-definition $TaskDef `
  --region $Region `
  --output json | ConvertFrom-Json

$Container = $TaskDefDetails.taskDefinition.containerDefinitions[0]
Write-Host "Container: $($Container.name)"
Write-Host "Image: $($Container.image)"
Write-Host "CPU: $($TaskDefDetails.taskDefinition.cpu)"
Write-Host "Memory: $($TaskDefDetails.taskDefinition.memory)"
Write-Host "`nEnvironment Variables:"
$Container.environment | ForEach-Object {
    Write-Host "  $($_.name) = $($_.value)"
}

Write-Host "`nSecrets (from Secrets Manager):"
$Container.secrets | ForEach-Object {
    Write-Host "  $($_.name) ← $($_.valueFrom)"
}

Write-Host "`nHealth Check:"
if ($Container.healthCheck) {
    Write-Host "  Command: $($Container.healthCheck.command -join ' ')"
    Write-Host "  Interval: $($Container.healthCheck.interval)s"
    Write-Host "  Timeout: $($Container.healthCheck.timeout)s"
    Write-Host "  Retries: $($Container.healthCheck.retries)"
    Write-Host "  Start Period: $($Container.healthCheck.startPeriod)s"
} else {
    Write-Host "  No health check configured"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "INVESTIGATION COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUMMARY OF FINDINGS:" -ForegroundColor Yellow
Write-Host "  Check the output above for:"
Write-Host "  - Red markers indicate problems"
Write-Host "  - Green markers indicate working components"
Write-Host "  - Look for ERROR messages in logs"
Write-Host "  - Check if ECS can reach RDS (security groups)"
Write-Host "  - Verify all secrets exist"
