# ============================================================================
# LiteEvent - Cost-Optimized Terraform Configuration
# ============================================================================
# Target Cost: ~$155/month (saves $45 from original $200)
#
# Optimizations:
# - NAT Gateways: 2 → 1 (saves $45/month)
# - Keeps cheap instance sizes (db.t4g.micro)
# - Adds GitHub OIDC (no cost, better security)
# - Adds ECS Exec (no cost, better debugging)
# - Adds S3 VPC endpoint (saves data transfer costs)
# - Single environment (no staging)
# ============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for state management (optional but recommended)
  backend "s3" {
    bucket         = "liteevent-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "liteevent-terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "cost-optimized"
    }
  }
}

# ========================================
# Data Sources
# ========================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ========================================
# VPC Module (OPTIMIZED - 1 NAT Gateway)
# ========================================

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  # COST OPTIMIZATION: Only 1 NAT Gateway instead of 2
  # Saves: $45/month
  enable_nat_gateway     = true
  single_nat_gateway     = true  # This is the key!

  # Enable S3 VPC endpoint (free, saves data transfer)
  enable_s3_endpoint     = true

  # Optional: Enable other VPC endpoints (adds ~$7/month but saves NAT costs)
  enable_ecr_endpoints   = var.enable_vpc_endpoints
  enable_logs_endpoint   = var.enable_vpc_endpoints
  enable_ssm_endpoints   = var.enable_vpc_endpoints  # For ECS Exec
}

# ========================================
# RDS PostgreSQL (CHEAP - db.t4g.micro)
# ========================================

module "rds" {
  source = "../../modules/rds"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids

  # COST OPTIMIZATION: Keep original cheap instance
  db_instance_class   = "db.t4g.micro"  # ~$15/month
  db_allocated_storage = 20

  # Single-AZ for cost savings (NOT recommended for production)
  multi_az            = false

  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password

  # Backups
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  # Enable deletion protection for production
  deletion_protection = var.environment == "production"
}

# ========================================
# ElastiCache Redis (DISABLED by default)
# ========================================

module "elasticache" {
  count  = var.enable_redis ? 1 : 0
  source = "../../modules/elasticache"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  # COST OPTIMIZATION: Smallest instance
  node_type          = "cache.t4g.micro"  # ~$12/month
  num_cache_nodes    = 1

  # Backups
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
}

# ========================================
# Application Load Balancer
# ========================================

module "alb" {
  source = "../../modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids

  # SSL Certificate
  certificate_arn    = var.acm_certificate_arn

  # Enable deletion protection for production
  enable_deletion_protection = var.environment == "production"
}

# ========================================
# S3 Buckets
# ========================================

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment

  # Enable versioning for production
  enable_versioning = var.environment == "production"
}

# ========================================
# GitHub OIDC (NEW - No AWS Keys Needed!)
# ========================================

module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name = var.project_name
  environment  = var.environment

  # Your GitHub repository
  github_org  = var.github_org
  github_repo = var.github_repo

  # Permissions
  ecr_repository_arns = [
    aws_ecr_repository.api.arn,
    aws_ecr_repository.web.arn,
    aws_ecr_repository.vendors.arn
  ]

  ecs_cluster_arn = module.ecs.cluster_arn

  # Allow GitHub Actions to update ECS services
  ecs_service_arns = [
    module.ecs.api_service_arn,
    module.ecs.web_service_arn,
    module.ecs.vendors_service_arn
  ]
}

# ========================================
# ECS Cluster and Services (OPTIMIZED)
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
  db_host              = module.rds.db_endpoint
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  db_security_group_id = module.rds.security_group_id

  # Redis (optional)
  redis_host              = var.enable_redis ? module.elasticache[0].redis_endpoint : ""
  redis_security_group_id = var.enable_redis ? module.elasticache[0].security_group_id : ""

  # S3
  images_bucket_name = module.s3.images_bucket_name

  # ECR repositories
  ecr_api_repository_url     = aws_ecr_repository.api.repository_url
  ecr_web_repository_url     = aws_ecr_repository.web.repository_url
  ecr_vendors_repository_url = aws_ecr_repository.vendors.repository_url

  # COST OPTIMIZATION: Only 1 task per service
  api_desired_count     = 1
  web_desired_count     = 1
  vendors_desired_count = 1

  # COST OPTIMIZATION: Smaller CPU/Memory
  api_cpu      = 512   # 0.5 vCPU
  api_memory   = 1024  # 1 GB
  web_cpu      = 256   # 0.25 vCPU
  web_memory   = 512   # 0.5 GB
  vendors_cpu  = 256
  vendors_memory = 512

  # NEW: Enable ECS Exec for debugging
  enable_ecs_exec = true

  # Environment variables
  environment_variables = {
    NODE_ENV            = "production"
    FRONTEND_URL        = var.frontend_url
    CORS_ORIGIN         = var.cors_origin
    RESEND_API_KEY      = var.resend_api_key
    STRIPE_SECRET_KEY   = var.stripe_secret_key
    GOOGLE_CLIENT_ID    = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    CLOUDINARY_CLOUD_NAME = var.cloudinary_cloud_name
    CLOUDINARY_API_KEY    = var.cloudinary_api_key
    CLOUDINARY_API_SECRET = var.cloudinary_api_secret
    JWT_SECRET          = var.jwt_secret
    JWT_REFRESH_SECRET  = var.jwt_refresh_secret
  }
}

# ========================================
# CloudFront CDN (Optional)
# ========================================

module "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  source = "../../modules/cloudfront"

  project_name     = var.project_name
  environment      = var.environment
  alb_dns_name     = module.alb.alb_dns_name
  assets_bucket_id = module.s3.assets_bucket_id

  # Custom domains
  web_domain_name     = var.web_domain_name
  vendors_domain_name = var.vendors_domain_name

  # SSL Certificate (must be in us-east-1)
  acm_certificate_arn = var.acm_certificate_arn_cloudfront
}

# ========================================
# SES Email Service
# ========================================

module "ses" {
  source = "../../modules/ses"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

# ========================================
# ECR Repositories
# ========================================

resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-api-ecr"
  }
}

resource "aws_ecr_repository" "web" {
  name                 = "${var.project_name}-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-web-ecr"
  }
}

resource "aws_ecr_repository" "vendors" {
  name                 = "${var.project_name}-vendors"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-vendors-ecr"
  }
}

# ========================================
# ECR Lifecycle Policies
# ========================================

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5  # Reduced from 10 to save storage costs
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
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
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
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}
