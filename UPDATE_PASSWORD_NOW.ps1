# Fix Database Password - Run This Now!

Write-Host "🔧 Updating RDS password and Secrets Manager..." -ForegroundColor Cyan

# Navigate to terraform directory
cd terraform\environments\production

# Apply terraform changes to update RDS and Secrets Manager
Write-Host "`n📝 Running terraform apply..." -ForegroundColor Yellow
terraform apply -auto-approve

# Force ECS to restart and pick up new secrets
Write-Host "`n🔄 Restarting ECS services..." -ForegroundColor Yellow

aws ecs update-service `
  --cluster liteevent-production-cluster `
  --service liteevent-production-api-service `
  --force-new-deployment

Write-Host "`n✅ Done! Wait 2-3 minutes for ECS to restart." -ForegroundColor Green
Write-Host "Monitor at: https://github.com/joelswaku/event-plateform/actions" -ForegroundColor Cyan
