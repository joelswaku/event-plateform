# Create ACM Certificate for liteevent.com
# This script requests an SSL certificate from AWS Certificate Manager

Write-Host "🔐 Creating ACM Certificate for liteevent.com..." -ForegroundColor Cyan
Write-Host ""

# Add AWS CLI to PATH
$env:Path += ";C:\Users\joels\AppData\Roaming\Python\Python313\Scripts"

# Request certificate
Write-Host "Requesting certificate for liteevent.com and *.liteevent.com..." -ForegroundColor Yellow

$result = aws acm request-certificate `
    --domain-name "liteevent.com" `
    --subject-alternative-names "*.liteevent.com" `
    --validation-method DNS `
    --region us-east-1 `
    --output json | ConvertFrom-Json

$certArn = $result.CertificateArn

Write-Host "✅ Certificate requested successfully!" -ForegroundColor Green
Write-Host "   ARN: $certArn" -ForegroundColor White
Write-Host ""

# Get validation records
Write-Host "⏳ Waiting for validation records..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$cert = aws acm describe-certificate `
    --certificate-arn $certArn `
    --region us-east-1 `
    --output json | ConvertFrom-Json

Write-Host ""
Write-Host "📋 DNS Validation Records:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($validation in $cert.Certificate.DomainValidationOptions) {
    $domain = $validation.DomainName
    $record = $validation.ResourceRecord

    Write-Host "Domain: $domain" -ForegroundColor White
    Write-Host "  Record Type: $($record.Type)" -ForegroundColor Gray
    Write-Host "  Record Name: $($record.Name)" -ForegroundColor Yellow
    Write-Host "  Record Value: $($record.Value)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Green
Write-Host "1. Add the above CNAME records to your domain's DNS" -ForegroundColor White
Write-Host "2. Wait for DNS propagation (usually 5-10 minutes)" -ForegroundColor White
Write-Host "3. AWS will automatically validate the certificate" -ForegroundColor White
Write-Host "4. Once validated, update terraform.tfvars with this ARN:" -ForegroundColor White
Write-Host "   $certArn" -ForegroundColor Yellow
Write-Host ""
Write-Host "To check validation status, run:" -ForegroundColor Gray
Write-Host "  aws acm describe-certificate --certificate-arn $certArn --region us-east-1" -ForegroundColor Gray
Write-Host ""

# Save ARN to file for easy reference
$certArn | Out-File -FilePath "certificate-arn.txt" -Encoding UTF8
Write-Host "Certificate ARN saved to: certificate-arn.txt" -ForegroundColor Green
