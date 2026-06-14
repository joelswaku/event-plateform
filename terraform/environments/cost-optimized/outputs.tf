# ============================================================================
# Cost-Optimized Terraform Outputs
# ============================================================================

# ========================================
# VPC Outputs
# ========================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# ========================================
# Load Balancer Outputs
# ========================================

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID (for Route53)"
  value       = module.alb.alb_zone_id
}

output "alb_url" {
  description = "Full ALB URL"
  value       = "http://${module.alb.alb_dns_name}"
}

# ========================================
# Database Outputs
# ========================================

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = var.db_name
}

output "database_connection_string" {
  description = "Database connection string for application"
  value       = "postgresql://${var.db_username}:***@${module.rds.db_endpoint}/${var.db_name}"
  sensitive   = true
}

# ========================================
# Redis Outputs (if enabled)
# ========================================

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = var.enable_redis ? module.elasticache[0].redis_endpoint : "Redis not enabled - set enable_redis=true to enable"
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = var.enable_redis ? "redis://${module.elasticache[0].redis_endpoint}:6379" : "Redis disabled"
}

# ========================================
# ECS Outputs
# ========================================

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_api_service_name" {
  description = "ECS API service name"
  value       = module.ecs.api_service_name
}

output "ecs_web_service_name" {
  description = "ECS Web service name"
  value       = module.ecs.web_service_name
}

output "ecs_vendors_service_name" {
  description = "ECS Vendors service name"
  value       = module.ecs.vendors_service_name
}

# ========================================
# ECS Exec Commands (NEW!)
# ========================================

output "ecs_exec_api_command" {
  description = "Command to shell into API container"
  value       = <<-EOT
    # First, get the task ARN:
    TASK=$(aws ecs list-tasks --cluster ${module.ecs.cluster_name} --service-name ${module.ecs.api_service_name} --query 'taskArns[0]' --output text)

    # Then exec into it:
    aws ecs execute-command \
      --cluster ${module.ecs.cluster_name} \
      --task $TASK \
      --container api \
      --interactive \
      --command "/bin/sh"
  EOT
}

# ========================================
# ECR Outputs
# ========================================

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

# ========================================
# S3 Outputs
# ========================================

output "s3_images_bucket_name" {
  description = "S3 bucket name for images"
  value       = module.s3.images_bucket_name
}

output "s3_assets_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = module.s3.assets_bucket_name
}

# ========================================
# CloudFront Outputs (if enabled)
# ========================================

output "cloudfront_web_domain" {
  description = "CloudFront distribution domain for web"
  value       = var.enable_cloudfront ? module.cloudfront[0].web_distribution_domain_name : "CloudFront not enabled"
}

output "cloudfront_vendors_domain" {
  description = "CloudFront distribution domain for vendors"
  value       = var.enable_cloudfront ? module.cloudfront[0].vendors_distribution_domain_name : "CloudFront not enabled"
}

# ========================================
# SES Outputs
# ========================================

output "ses_identity_arn" {
  description = "SES domain identity ARN"
  value       = module.ses.domain_identity_arn
}

output "ses_domain_verification_token" {
  description = "SES domain verification TXT record value"
  value       = module.ses.domain_verification_token
}

# ========================================
# GitHub OIDC Outputs (NEW!)
# ========================================

output "github_oidc_role_arn" {
  description = "IAM role ARN for GitHub Actions (use this in workflows)"
  value       = module.github_oidc.role_arn
}

output "github_oidc_provider_arn" {
  description = "OIDC provider ARN"
  value       = module.github_oidc.provider_arn
}

# ========================================
# Deployment Commands
# ========================================

output "deployment_commands" {
  description = "Useful deployment commands"
  value       = <<-EOT
    # ========================================
    # Docker Build & Push
    # ========================================

    # Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.api.repository_url}

    # Build and push API
    docker build -t ${aws_ecr_repository.api.repository_url}:latest ./api
    docker push ${aws_ecr_repository.api.repository_url}:latest

    # Build and push Web
    docker build -t ${aws_ecr_repository.web.repository_url}:latest ./web
    docker push ${aws_ecr_repository.web.repository_url}:latest

    # Build and push Vendors
    docker build -t ${aws_ecr_repository.vendors.repository_url}:latest ./vendors
    docker push ${aws_ecr_repository.vendors.repository_url}:latest

    # ========================================
    # ECS Service Updates
    # ========================================

    # Update API service
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.ecs.api_service_name} --force-new-deployment

    # Update Web service
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.ecs.web_service_name} --force-new-deployment

    # Update Vendors service
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.ecs.vendors_service_name} --force-new-deployment

    # ========================================
    # Database Migrations
    # ========================================

    # Run migrations via ECS Exec
    TASK=$(aws ecs list-tasks --cluster ${module.ecs.cluster_name} --service-name ${module.ecs.api_service_name} --query 'taskArns[0]' --output text)

    aws ecs execute-command \
      --cluster ${module.ecs.cluster_name} \
      --task $TASK \
      --container api \
      --interactive \
      --command "npm run migrate"
  EOT
}

# ========================================
# DNS Configuration
# ========================================

output "dns_configuration" {
  description = "DNS records to create in Route53"
  value       = <<-EOT
    # ========================================
    # Route53 DNS Records
    # ========================================

    # Main website (liteevent.com)
    Type: A (Alias)
    Name: liteevent.com
    Value: ${module.alb.alb_dns_name}
    Alias Target Zone: ${module.alb.alb_zone_id}

    # WWW redirect
    Type: CNAME
    Name: www.liteevent.com
    Value: liteevent.com

    # API subdomain
    Type: A (Alias)
    Name: api.liteevent.com
    Value: ${module.alb.alb_dns_name}
    Alias Target Zone: ${module.alb.alb_zone_id}

    # Vendors portal
    Type: A (Alias)
    Name: vendors.liteevent.com
    Value: ${module.alb.alb_dns_name}
    Alias Target Zone: ${module.alb.alb_zone_id}

    # ========================================
    # SES Verification Records
    # ========================================

    # Domain verification TXT record
    Type: TXT
    Name: _amazonses.${var.domain_name}
    Value: ${module.ses.domain_verification_token}

    # DKIM records (check SES console for values)
    # You'll need to add 3 CNAME records for DKIM
  EOT
}

# ========================================
# Cost Estimate
# ========================================

output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value       = <<-EOT
    # ========================================
    # Cost Breakdown (Estimated)
    # ========================================

    NAT Gateway (1):              $45/month
    ALB:                          $25/month
    ECS Fargate (3 services):     $30/month
    RDS (db.t4g.micro):           $15/month
    Redis:                        ${var.enable_redis ? "$12/month" : "$0 (disabled)"}
    CloudFront:                   ${var.enable_cloudfront ? "$15/month" : "$0 (disabled)"}
    VPC Endpoints:                ${var.enable_vpc_endpoints ? "$7/month" : "$0 (disabled)"}
    S3 + CloudWatch:              $10/month
    ECR:                          $2/month
    Data Transfer:                $10/month
    ────────────────────────────────
    TOTAL:                        ~$155/month

    # Compared to original: SAVES $45/month!
    # Compared to new setup: SAVES $70-200/month!
  EOT
}
