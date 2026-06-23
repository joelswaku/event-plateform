# Cloudflare DNS Setup Script
# Run this after deployment completes

Write-Host "🌐 Setting up Cloudflare DNS for LiteEvent" -ForegroundColor Cyan

# ALB DNS from Terraform output
$ALB_DNS = "liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com"

Write-Host "`n📋 You need to add these DNS records in Cloudflare:`n" -ForegroundColor Yellow

Write-Host "1. API Subdomain:" -ForegroundColor Green
Write-Host "   Type: CNAME"
Write-Host "   Name: api"
Write-Host "   Target: $ALB_DNS"
Write-Host "   Proxy: DNS only (grey cloud) ⚠️ IMPORTANT!`n"

Write-Host "2. Main Domain:" -ForegroundColor Green
Write-Host "   Type: CNAME"
Write-Host "   Name: @"
Write-Host "   Target: $ALB_DNS"
Write-Host "   Proxy: DNS only (grey cloud) ⚠️ IMPORTANT!`n"

Write-Host "3. Vendors Subdomain:" -ForegroundColor Green
Write-Host "   Type: CNAME"
Write-Host "   Name: vendors"
Write-Host "   Target: $ALB_DNS"
Write-Host "   Proxy: DNS only (grey cloud) ⚠️ IMPORTANT!`n"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔗 Go to: https://dash.cloudflare.com" -ForegroundColor Yellow
Write-Host "   → Select: liteevent.com" -ForegroundColor Yellow
Write-Host "   → Click: DNS" -ForegroundColor Yellow
Write-Host "   → Add the 3 records above" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Read-Host "Press Enter when DNS records are added..."

Write-Host "`n✅ Testing DNS propagation..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "`nResolving api.liteevent.com..." -ForegroundColor Yellow
nslookup api.liteevent.com

Write-Host "`nResolving liteevent.com..." -ForegroundColor Yellow
nslookup liteevent.com

Write-Host "`n✅ DNS Setup Complete!" -ForegroundColor Green
Write-Host "Wait 1-2 minutes for DNS to propagate globally." -ForegroundColor Yellow
