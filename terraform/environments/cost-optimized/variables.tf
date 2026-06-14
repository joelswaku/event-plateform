# ============================================================================
# Cost-Optimized Terraform Variables
# ============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "liteevent"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ========================================
# Cost Optimization Flags
# ========================================

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints for ECR, Logs, SSM (adds ~$7/month but saves NAT costs)"
  type        = bool
  default     = false  # Set to true if high traffic
}

variable "enable_redis" {
  description = "Enable ElastiCache Redis (adds ~$12/month)"
  type        = bool
  default     = false  # Disabled by default to save costs
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN (adds ~$15/month)"
  type        = bool
  default     = false  # Optional, use ALB directly to save costs
}

# ========================================
# Database Variables
# ========================================

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "liteevent"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "liteevent_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password - MUST be strong!"
  type        = string
  sensitive   = true
}

# ========================================
# GitHub OIDC Variables
# ========================================

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "your-github-username"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "event-plateform"
}

# ========================================
# SSL Certificates
# ========================================

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for ALB (must be in same region)"
  type        = string
}

variable "acm_certificate_arn_cloudfront" {
  description = "ACM certificate ARN for CloudFront (must be us-east-1)"
  type        = string
  default     = ""  # Only needed if enable_cloudfront = true
}

# ========================================
# Domain Names
# ========================================

variable "domain_name" {
  description = "Root domain name (for SES)"
  type        = string
  default     = "liteevent.com"
}

variable "web_domain_name" {
  description = "Web app domain"
  type        = string
  default     = "liteevent.com"
}

variable "vendors_domain_name" {
  description = "Vendors portal domain"
  type        = string
  default     = "vendors.liteevent.com"
}

variable "frontend_url" {
  description = "Frontend URL for CORS and emails"
  type        = string
  default     = "https://liteevent.com"
}

variable "cors_origin" {
  description = "Allowed CORS origins (comma-separated)"
  type        = string
  default     = "https://liteevent.com,https://www.liteevent.com,https://vendors.liteevent.com"
}

# ========================================
# Application Secrets
# ========================================
# NOTE: In production, consider using AWS Secrets Manager
# For now, we keep them as variables to avoid extra costs

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key (use live key for production)"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for email"
  type        = string
  sensitive   = true
}

variable "cloudinary_cloud_name" {
  description = "Cloudinary cloud name"
  type        = string
  default     = ""
}

variable "cloudinary_api_key" {
  description = "Cloudinary API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudinary_api_secret" {
  description = "Cloudinary API secret"
  type        = string
  sensitive   = true
  default     = ""
}
