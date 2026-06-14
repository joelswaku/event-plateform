terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for state management
  backend "s3" {
    bucket         = "event-platform-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ========================================
# Data Sources
# ========================================

data "aws_caller_identity" "current" {}

# ========================================
# VPC Module
# ========================================

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  # NO NAT Gateway - using VPC Endpoints instead
  # Saves ~$45/month, uses VPC endpoints for AWS service access
  enable_nat_gateway = false

  # Optional endpoints (not needed - core endpoints always enabled in module)
  enable_dynamodb_endpoint = false
  enable_ses_endpoint      = false
  enable_rds_endpoint      = false
}

# ========================================
# Secrets Manager Module
# ========================================

module "secrets" {
  source = "../../modules/secrets"

  project_name = var.project_name
  environment  = var.environment

  # Database
  db_username = var.db_username
  db_password = var.db_password
  db_host     = module.rds.db_endpoint
  db_port     = 5432
  db_name     = var.db_name

  # JWT
  jwt_secret         = var.jwt_secret
  jwt_refresh_secret = var.jwt_refresh_secret

  # Stripe
  stripe_secret_key      = var.stripe_secret_key
  stripe_publishable_key = var.stripe_publishable_key
  stripe_webhook_secret  = var.stripe_webhook_secret

  # Google OAuth
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  # Resend removed - using SES only

  # Cloudinary (optional)
  cloudinary_cloud_name = var.cloudinary_cloud_name
  cloudinary_api_key    = var.cloudinary_api_key
  cloudinary_api_secret = var.cloudinary_api_secret

  # Redis (optional)
  redis_host = var.enable_redis ? module.elasticache[0].redis_endpoint : ""
}

# ========================================
# RDS PostgreSQL Module
# ========================================

module "rds" {
  source = "../../modules/rds"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  db_instance_class   = var.db_instance_class
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
  multi_az            = false # Single AZ for staging
}

# ========================================
# ElastiCache Redis Module (Optional)
# ========================================

module "elasticache" {
  count  = var.enable_redis ? 1 : 0
  source = "../../modules/elasticache"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
  num_cache_nodes    = 1 # Single node for staging
}

# ========================================
# Application Load Balancer Module
# ========================================

module "alb" {
  source = "../../modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  certificate_arn    = var.acm_certificate_arn
}

# ========================================
# S3 Buckets Module
# ========================================

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# ========================================
# ECR Repositories
# ========================================

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-${var.environment}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-repo"
  }
}

resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}-${var.environment}-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-web-repo"
  }
}

resource "aws_ecr_repository" "vendors" {
  name                 = "${var.project_name}-${var.environment}-vendors"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-vendors-repo"
  }
}

# ECR Lifecycle Policies
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "vendors" {
  repository = aws_ecr_repository.vendors.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# ========================================
# ECS Cluster and Services Module
# ========================================

module "ecs" {
  source = "../../modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  # Load Balancer
  alb_security_group_id        = module.alb.alb_security_group_id
  alb_target_group_api_arn     = module.alb.target_group_api_arn
  alb_target_group_web_arn     = module.alb.target_group_web_arn
  alb_target_group_vendors_arn = module.alb.target_group_vendors_arn

  # Database
  db_security_group_id = module.rds.security_group_id

  # Redis (optional)
  redis_host              = var.enable_redis ? module.elasticache[0].redis_endpoint : ""
  redis_security_group_id = var.enable_redis ? module.elasticache[0].security_group_id : ""

  # S3
  images_bucket_name = module.s3.images_bucket_name

  # Secrets Manager ARNs
  database_secret_arn     = module.secrets.database_secret_arn
  jwt_secret_arn          = module.secrets.jwt_secret_arn
  stripe_secret_arn       = module.secrets.stripe_secret_arn
  google_oauth_secret_arn = module.secrets.google_oauth_secret_arn
  secret_arns             = module.secrets.all_secret_arns

  # ECR repositories
  ecr_api_repository_url     = aws_ecr_repository.api.repository_url
  ecr_web_repository_url     = aws_ecr_repository.web.repository_url
  ecr_vendors_repository_url = aws_ecr_repository.vendors.repository_url
}

# ========================================
# CloudFront Module
# ========================================

module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name            = var.project_name
  environment             = var.environment
  alb_dns_name            = module.alb.alb_dns_name
  assets_bucket_id        = module.s3.assets_bucket_id
  web_domain_name         = var.web_domain_name
  vendors_domain_name     = var.vendors_domain_name
  acm_certificate_arn     = var.acm_certificate_arn_cloudfront
}

# ========================================
# SES Module
# ========================================

module "ses" {
  source = "../../modules/ses"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

# ========================================
# GitHub OIDC Module
# ========================================

module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name = var.project_name
  environment  = var.environment
  github_org   = var.github_org
  github_repo  = var.github_repo

  ecr_repository_arns = [
    aws_ecr_repository.api.arn,
    aws_ecr_repository.web.arn,
    aws_ecr_repository.vendors.arn
  ]

  ecs_task_role_arns = [
    module.ecs.task_execution_role_arn,
    module.ecs.task_role_arn
  ]

  enable_secrets_access = false # Staging doesn't need secrets access in CI
}
