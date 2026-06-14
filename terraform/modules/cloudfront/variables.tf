variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "assets_bucket_id" {
  description = "S3 assets bucket ID"
  type        = string
}

variable "web_domain_name" {
  description = "Custom domain name for web app"
  type        = string
  default     = ""
}

variable "vendors_domain_name" {
  description = "Custom domain name for vendors app"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
  default     = ""
}
