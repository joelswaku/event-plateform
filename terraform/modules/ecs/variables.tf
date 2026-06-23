variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "alb_target_group_api_arn" {
  description = "ALB target group ARN for API"
  type        = string
}

variable "alb_target_group_web_arn" {
  description = "ALB target group ARN for Web"
  type        = string
}

variable "alb_target_group_vendors_arn" {
  description = "ALB target group ARN for Vendors"
  type        = string
}

variable "db_security_group_id" {
  description = "Database security group ID"
  type        = string
}

variable "redis_host" {
  description = "Redis host (optional)"
  type        = string
  default     = ""
}

variable "redis_security_group_id" {
  description = "Redis security group ID (optional)"
  type        = string
  default     = ""
}

variable "images_bucket_name" {
  description = "S3 bucket name for images"
  type        = string
}

# Secrets Manager ARNs (replaces hardcoded secrets)
variable "database_secret_arn" {
  description = "ARN of the database secret in Secrets Manager"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  type        = string
}

variable "stripe_secret_arn" {
  description = "ARN of the Stripe secret in Secrets Manager"
  type        = string
}

variable "google_oauth_secret_arn" {
  description = "ARN of the Google OAuth secret in Secrets Manager"
  type        = string
}

variable "anthropic_secret_arn" {
  description = "ARN of the Anthropic API secret in Secrets Manager"
  type        = string
  default     = ""
}

variable "resend_secret_arn" {
  description = "ARN of the Resend secret in Secrets Manager"
  type        = string
}

variable "redis_secret_arn" {
  description = "ARN of the Redis secret in Secrets Manager (optional)"
  type        = string
  default     = ""
}

variable "secret_arns" {
  description = "List of all secret ARNs for IAM policy"
  type        = list(string)
}

variable "ecr_api_repository_url" {
  description = "ECR repository URL for API"
  type        = string
}

variable "ecr_web_repository_url" {
  description = "ECR repository URL for Web"
  type        = string
}

variable "ecr_vendors_repository_url" {
  description = "ECR repository URL for Vendors"
  type        = string
}
