# Test Production Deployment
# Tests all endpoints after Cloudflare DNS is configured

Write-Host "🧪 Testing LiteEvent Production Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$SUCCESS_COUNT = 0
$TOTAL_TESTS = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )

    $TOTAL_TESTS++
    Write-Host "Testing $Name..." -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
            $SUCCESS_COUNT++
        } else {
            Write-Host "⚠️  WARN - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test ALB directly first
Write-Host "1️⃣ Testing ALB (Load Balancer) Direct Access`n" -ForegroundColor Cyan
Test-Endpoint "ALB Health" "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/health"
Test-Endpoint "ALB Root" "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com/"

# Test API via domain
Write-Host "2️⃣ Testing API via Domain (api.liteevent.com)`n" -ForegroundColor Cyan
Test-Endpoint "API Health" "http://api.liteevent.com/health"
Test-Endpoint "API Root" "http://api.liteevent.com/"
Test-Endpoint "API Docs" "http://api.liteevent.com/api/docs"

# Test Web via domain
Write-Host "3️⃣ Testing Web App (liteevent.com)`n" -ForegroundColor Cyan
Test-Endpoint "Web Home" "http://liteevent.com/"

# Test Vendors via domain
Write-Host "4️⃣ Testing Vendors Portal (vendors.liteevent.com)`n" -ForegroundColor Cyan
Test-Endpoint "Vendors Home" "http://vendors.liteevent.com/"

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Passed: $SUCCESS_COUNT / $TOTAL_TESTS" -ForegroundColor $(if ($SUCCESS_COUNT -eq $TOTAL_TESTS) { "Green" } else { "Yellow" })

if ($SUCCESS_COUNT -eq $TOTAL_TESTS) {
    Write-Host "`n🎉 ALL TESTS PASSED! Your app is LIVE!" -ForegroundColor Green
    Write-Host "`n🌐 Access your app at:" -ForegroundColor Cyan
    Write-Host "   Web: http://liteevent.com" -ForegroundColor White
    Write-Host "   API: http://api.liteevent.com" -ForegroundColor White
    Write-Host "   Vendors: http://vendors.liteevent.com" -ForegroundColor White
} elseif ($SUCCESS_COUNT -gt 0) {
    Write-Host "`n⚠️  PARTIAL SUCCESS - Some tests failed" -ForegroundColor Yellow
    Write-Host "Check DNS propagation or wait a few minutes and try again." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ ALL TESTS FAILED" -ForegroundColor Red
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  1. Deployment completed successfully" -ForegroundColor Yellow
    Write-Host "  2. Cloudflare DNS records are correct" -ForegroundColor Yellow
    Write-Host "  3. DNS has propagated (wait 2-5 minutes)" -ForegroundColor Yellow
}

Write-Host "`n" -ForegroundColor White
