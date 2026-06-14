output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID"
  value       = module.alb.alb_zone_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = var.db_name
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = var.enable_redis ? module.elasticache[0].redis_endpoint : "Redis not enabled"
}

output "ecr_api_repository_url" {
  description = "ECR repository URL for API"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR repository URL for Web"
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_vendors_repository_url" {
  description = "ECR repository URL for Vendors"
  value       = aws_ecr_repository.vendors.repository_url
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = module.ecs.cluster_name
}

output "s3_images_bucket_name" {
  description = "S3 bucket name for images"
  value       = module.s3.images_bucket_name
}

output "s3_assets_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = module.s3.assets_bucket_name
}

output "cloudfront_web_domain_name" {
  description = "CloudFront distribution domain for web"
  value       = module.cloudfront.web_distribution_domain_name
}

output "cloudfront_vendors_domain_name" {
  description = "CloudFront distribution domain for vendors"
  value       = module.cloudfront.vendors_distribution_domain_name
}

output "ses_identity_arn" {
  description = "SES domain identity ARN"
  value       = module.ses.domain_identity_arn
}
