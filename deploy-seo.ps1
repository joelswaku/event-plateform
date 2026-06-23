# Deploy SEO Changes to Production
# This script commits and pushes all SEO-related changes to trigger production deployment

Write-Host "🚀 LiteEvent SEO Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$branch = git branch --show-current
Write-Host "📍 Current branch: $branch" -ForegroundColor Yellow

if ($branch -ne "main") {
    Write-Host "⚠️  Warning: You're not on the main branch!" -ForegroundColor Yellow
    $continue = Read-Host "Do you want to continue anyway? (y/N)"
    if ($continue -ne "y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "📋 Files to be committed:" -ForegroundColor Green
Write-Host "  - web/src/app/sitemap.ts"
Write-Host "  - web/public/robots.txt"
Write-Host "  - web/src/app/layout.js"
Write-Host "  - web/src/app/e/[slug]/page.js"
Write-Host "  - api/services/events.service.js"
Write-Host "  - api/controllers/events.controller.js"
Write-Host "  - api/routes/events.routes.js"
Write-Host "  - Documentation files"
Write-Host ""

# Check git status
Write-Host "🔍 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
$confirm = Read-Host "Ready to commit and push? This will trigger production deployment! (y/N)"

if ($confirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📦 Adding files to git..." -ForegroundColor Yellow

# Add SEO implementation files
git add web/src/app/sitemap.ts
git add web/public/robots.txt
git add web/src/app/layout.js
git add "web/src/app/e/[slug]/page.js"

# Add backend files
git add api/services/events.service.js
git add api/controllers/events.controller.js
git add api/routes/events.routes.js

# Add documentation
git add web/SEO-SETUP.md
git add web/SEO-DEPLOYMENT-CHECKLIST.md
git add web/QUICK-START-SEO.md
git add SEO-IMPLEMENTATION-SUMMARY.md
git add DEPLOY-SEO-CHANGES.md
git add deploy-seo.ps1

Write-Host "✅ Files staged" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Add comprehensive SEO sitemap implementation

- Add dynamic sitemap.ts with hourly revalidation
- Add robots.txt for search engine directives
- Enhance metadata with Open Graph and Twitter cards
- Add JSON-LD structured data for events
- Create API endpoint /events/public-sitemap
- Add complete SEO documentation

Changes:
- Frontend: sitemap.xml, robots.txt, enhanced metadata
- Backend: GET /api/events/public-sitemap endpoint
- Docs: Complete setup and deployment guides"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  This will trigger production deployment!" -ForegroundColor Yellow
Write-Host ""

git push origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Go to GitHub Actions to monitor deployment"
Write-Host "  2. You'll need to APPROVE the deployment in the 'production' environment"
Write-Host "  3. Wait for deployment to complete (~10 minutes)"
Write-Host "  4. Verify sitemap: https://liteevent.com/sitemap.xml"
Write-Host "  5. Submit to Google Search Console"
Write-Host ""
Write-Host "📖 See DEPLOY-SEO-CHANGES.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""

# Try to open GitHub Actions in browser
$openBrowser = Read-Host "Open GitHub Actions in browser? (y/N)"
if ($openBrowser -eq "y") {
    # Get repository URL from git remote
    $remoteUrl = git config --get remote.origin.url
    if ($remoteUrl -match "github.com[:/](.+/.+?)(.git)?$") {
        $repo = $Matches[1]
        $actionsUrl = "https://github.com/$repo/actions"
        Start-Process $actionsUrl
        Write-Host "✅ Opened GitHub Actions in browser" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not determine GitHub repository URL" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Deployment initiated! Monitor progress in GitHub Actions." -ForegroundColor Green
