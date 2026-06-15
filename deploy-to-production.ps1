# ============================================================================
# LiteEvent Production Deployment Script
# ============================================================================
# This script commits your changes and pushes to GitHub, triggering
# the automated deployment pipeline via GitHub Actions
# ============================================================================

Write-Host "=" -ForegroundColor Cyan
Write-Host "🚀 LiteEvent Production Deployment" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location $PSScriptRoot

# Check git status
Write-Host "📊 Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Found changes to commit:" -ForegroundColor Green
    git status --short
} else {
    Write-Host "⚠️  No changes to commit. Triggering deployment anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan

# Confirm deployment
$confirm = Read-Host "Deploy to PRODUCTION? This will trigger AWS deployment. (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Preparing deployment..." -ForegroundColor Yellow

# Add docker-compose changes
if (Test-Path "docker-compose.yml") {
    git add docker-compose.yml
    Write-Host "✅ Added docker-compose.yml" -ForegroundColor Green
}

# Add all other changes
git add .

# Create commit
$commitMessage = "chore: configure production deployment with Redis and updated docker-compose

- Enable Redis service in docker-compose
- Update web/vendors build targets to deps
- Configure environment for production deployment
- Ready for ECS deployment

[deploy]"

Write-Host "📦 Creating commit..." -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No new changes to commit, but we'll push anyway..." -ForegroundColor Yellow
}

# Push to main branch
Write-Host ""
Write-Host "🚀 Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Write-Host "Please check your GitHub credentials and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -ForegroundColor Green
Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open GitHub Actions:" -ForegroundColor White
Write-Host "   https://github.com/joelswaku/event-plateform/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "2. You'll see 'Deploy to Production' workflow waiting for approval" -ForegroundColor White
Write-Host ""
Write-Host "3. Click the workflow run → 'Review deployments' → Approve" -ForegroundColor White
Write-Host ""
Write-Host "4. Monitor the deployment (takes ~10-15 minutes):" -ForegroundColor White
Write-Host "   - Build Docker images" -ForegroundColor Gray
Write-Host "   - Push to ECR" -ForegroundColor Gray
Write-Host "   - Deploy to ECS Fargate" -ForegroundColor Gray
Write-Host "   - Health checks" -ForegroundColor Gray
Write-Host ""
Write-Host "5. After deployment, configure DNS records (see DEPLOY_NOW.md)" -ForegroundColor White
Write-Host ""
Write-Host "=" -ForegroundColor Green
Write-Host "🎉 Deployment initiated! Check GitHub Actions for progress." -ForegroundColor Green
Write-Host "=" -ForegroundColor Green
Write-Host ""

# Try to open GitHub Actions in browser
try {
    Start-Process "https://github.com/joelswaku/event-plateform/actions"
    Write-Host "✅ Opened GitHub Actions in your browser" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not open browser automatically" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 For detailed deployment info, see: DEPLOY_NOW.md" -ForegroundColor Cyan
Write-Host ""
