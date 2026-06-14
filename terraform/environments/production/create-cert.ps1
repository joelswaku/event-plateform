# Create ACM Certificate
$env:Path += ";C:\Users\joels\AppData\Roaming\Python\Python313\Scripts"

Write-Host "Creating ACM Certificate..." -ForegroundColor Cyan

$result = aws acm request-certificate --domain-name "liteevent.com" --subject-alternative-names "*.liteevent.com" --validation-method DNS --region us-east-1 --output json | ConvertFrom-Json

$certArn = $result.CertificateArn
Write-Host "Certificate ARN: $certArn" -ForegroundColor Green

Start-Sleep -Seconds 3

$cert = aws acm describe-certificate --certificate-arn $certArn --region us-east-1 --output json | ConvertFrom-Json

Write-Host ""
Write-Host "DNS Validation Records:" -ForegroundColor Yellow

foreach ($validation in $cert.Certificate.DomainValidationOptions) {
    Write-Host "Domain: $($validation.DomainName)"
    Write-Host "  Type: $($validation.ResourceRecord.Type)"
    Write-Host "  Name: $($validation.ResourceRecord.Name)"
    Write-Host "  Value: $($validation.ResourceRecord.Value)"
    Write-Host ""
}

$certArn | Out-File -FilePath "certificate-arn.txt" -Encoding UTF8
Write-Host "ARN saved to certificate-arn.txt" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Add these CNAME records to your domain DNS provider"
