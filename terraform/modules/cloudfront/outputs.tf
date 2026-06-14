output "web_distribution_id" {
  description = "CloudFront distribution ID for web"
  value       = aws_cloudfront_distribution.web.id
}

output "web_distribution_domain_name" {
  description = "CloudFront distribution domain name for web"
  value       = aws_cloudfront_distribution.web.domain_name
}

output "vendors_distribution_id" {
  description = "CloudFront distribution ID for vendors"
  value       = aws_cloudfront_distribution.vendors.id
}

output "vendors_distribution_domain_name" {
  description = "CloudFront distribution domain name for vendors"
  value       = aws_cloudfront_distribution.vendors.domain_name
}
