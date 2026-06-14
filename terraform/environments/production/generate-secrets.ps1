# Generate Production Secrets
# Run this script to generate secure random secrets for production deployment

Write-Host "🔐 Generating Production Secrets..." -ForegroundColor Cyan
Write-Host ""

# Function to generate random base64 string
function New-RandomSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Generate secrets
$dbPassword = New-RandomSecret -Length 32
$jwtSecret = New-RandomSecret -Length 64
$jwtRefreshSecret = New-RandomSecret -Length 64

# Display secrets
Write-Host "📋 Copy these values to your terraform.tfvars file:" -ForegroundColor Green
Write-Host ""
Write-Host "# Database" -ForegroundColor Yellow
Write-Host "db_password = `"$dbPassword`""
Write-Host ""
Write-Host "# JWT Secrets" -ForegroundColor Yellow
Write-Host "jwt_secret = `"$jwtSecret`""
Write-Host "jwt_refresh_secret = `"$jwtRefreshSecret`""
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save these secrets securely!" -ForegroundColor Red
Write-Host "   - Add terraform.tfvars to .gitignore" -ForegroundColor Red
Write-Host "   - Store in a password manager" -ForegroundColor Red
Write-Host "   - Never commit to git" -ForegroundColor Red
Write-Host ""

# Save to file (optional)
$secretsFile = "secrets.txt"
@"
PRODUCTION SECRETS - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
=================================================================
KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT!

Database Password:
$dbPassword

JWT Secret:
$jwtSecret

JWT Refresh Secret:
$jwtRefreshSecret

=================================================================
Next Steps:
1. Copy these values to terraform.tfvars
2. Add your Stripe keys (from Stripe Dashboard)
3. Add your Google OAuth credentials
4. Add your Resend API key
5. Delete this file after copying
"@ | Out-File -FilePath $secretsFile -Encoding UTF8

Write-Host "✅ Secrets also saved to: $secretsFile" -ForegroundColor Green
Write-Host "   Delete this file after copying to terraform.tfvars!" -ForegroundColor Yellow
