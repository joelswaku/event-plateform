variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets (costs ~$45/month) - NOT NEEDED if using VPC Endpoints"
  type        = bool
  default     = false  # Disabled - using VPC Endpoints instead
}

variable "enable_dynamodb_endpoint" {
  description = "Enable DynamoDB VPC endpoint (gateway, free)"
  type        = bool
  default     = false
}

variable "enable_ses_endpoint" {
  description = "Enable SES VPC endpoint (interface, ~$7/month)"
  type        = bool
  default     = false
}

variable "enable_rds_endpoint" {
  description = "Enable RDS VPC endpoint (interface, ~$7/month)"
  type        = bool
  default     = false
}
