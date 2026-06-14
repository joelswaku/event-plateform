output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecr_api_repository_url" {
  description = "ECR API repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR Web repository URL"
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_vendors_repository_url" {
  description = "ECR Vendors repository URL"
  value       = aws_ecr_repository.vendors.repository_url
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN"
  value       = module.github_oidc.github_actions_role_arn
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "images_bucket_name" {
  description = "S3 images bucket name"
  value       = module.s3.images_bucket_name
}

output "cloudfront_web_domain" {
  description = "CloudFront distribution domain for web"
  value       = module.cloudfront.web_distribution_domain
}

output "cloudfront_vendors_domain" {
  description = "CloudFront distribution domain for vendors"
  value       = module.cloudfront.vendors_distribution_domain
}
