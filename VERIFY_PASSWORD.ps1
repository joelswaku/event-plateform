# Verify RDS password matches Secrets Manager

Write-Host "🔍 Checking password configuration..." -ForegroundColor Cyan

Write-Host "`n1. Getting Secrets Manager password..." -ForegroundColor Yellow
$secret = aws secretsmanager get-secret-value --secret-id liteevent/production/database --query SecretString --output text | ConvertFrom-Json
Write-Host "   Database URL from Secrets Manager:"
Write-Host "   $($secret.url)" -ForegroundColor Gray

Write-Host "`n2. Testing database connection..." -ForegroundColor Yellow
Write-Host "   Connecting to: $($secret.host)"
Write-Host "   Username: $($secret.username)"
Write-Host "   Password: $($secret.password.Substring(0,4))..." -ForegroundColor Gray

# Test if password is correct
$env:PGPASSWORD = $secret.password
$testResult = psql -h $secret.host -U $secret.username -d $secret.dbname -c "SELECT 1" 2>&1

if ($testResult -like "*password authentication failed*") {
    Write-Host "`n❌ PASSWORD MISMATCH!" -ForegroundColor Red
    Write-Host "The password in Secrets Manager doesn't work!" -ForegroundColor Red
} elseif ($?) {
    Write-Host "`n✅ Password is CORRECT!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Connection failed: $testResult" -ForegroundColor Yellow
}

Write-Host "`n3. Expected password: LiteEvent2026Pass" -ForegroundColor Yellow
Write-Host "   Actual password in Secrets Manager: $($secret.password)" -ForegroundColor Cyan

if ($secret.password -ne "LiteEvent2026Pass") {
    Write-Host "`n❌ MISMATCH! Secrets Manager has wrong password!" -ForegroundColor Red
    Write-Host "   Updating Secrets Manager now..." -ForegroundColor Yellow

    $correctSecret = @{
        username = $secret.username
        password = "LiteEvent2026Pass"
        host = $secret.host
        port = $secret.port
        dbname = $secret.dbname
        url = "postgresql://liteevent_admin:LiteEvent2026Pass@$($secret.host):5432/liteevent_production"
    } | ConvertTo-Json -Compress

    aws secretsmanager update-secret --secret-id liteevent/production/database --secret-string $correctSecret

    Write-Host "`n✅ Updated! Now restart ECS service:" -ForegroundColor Green
    Write-Host "   aws ecs update-service --cluster liteevent-production-cluster --service liteevent-production-api-service --force-new-deployment"
} else {
    Write-Host "`n✅ Password matches!" -ForegroundColor Green
}
