# AWS Secrets Manager Module
# Stores all application secrets securely

# Database Credentials
resource "aws_secretsmanager_secret" "database" {
  name        = "${var.project_name}/${var.environment}/database"
  description = "Database credentials for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-database-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.db_host
    port     = var.db_port
    dbname   = var.db_name
    url      = "postgresql://${var.db_username}:${var.db_password}@${var.db_host}:${var.db_port}/${var.db_name}"
  })
}

# JWT Secrets
resource "aws_secretsmanager_secret" "jwt" {
  name        = "${var.project_name}/${var.environment}/jwt"
  description = "JWT secrets for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-jwt-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({
    jwt_secret         = var.jwt_secret
    jwt_refresh_secret = var.jwt_refresh_secret
  })
}

# Stripe Secrets
resource "aws_secretsmanager_secret" "stripe" {
  name        = "${var.project_name}/${var.environment}/stripe"
  description = "Stripe API keys for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-stripe-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "stripe" {
  secret_id = aws_secretsmanager_secret.stripe.id
  secret_string = jsonencode({
    secret_key      = var.stripe_secret_key
    publishable_key = var.stripe_publishable_key
    webhook_secret  = var.stripe_webhook_secret
  })
}

# Google OAuth Secrets
resource "aws_secretsmanager_secret" "google_oauth" {
  name        = "${var.project_name}/${var.environment}/google-oauth"
  description = "Google OAuth credentials for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-google-oauth-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "google_oauth" {
  secret_id = aws_secretsmanager_secret.google_oauth.id
  secret_string = jsonencode({
    client_id     = var.google_client_id
    client_secret = var.google_client_secret
  })
}

# Resend removed - using SES only for email

# Cloudinary Secrets (optional)
resource "aws_secretsmanager_secret" "cloudinary" {
  count       = var.cloudinary_cloud_name != "" ? 1 : 0
  name        = "${var.project_name}/${var.environment}/cloudinary"
  description = "Cloudinary credentials for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudinary-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "cloudinary" {
  count     = var.cloudinary_cloud_name != "" ? 1 : 0
  secret_id = aws_secretsmanager_secret.cloudinary[0].id
  secret_string = jsonencode({
    cloud_name = var.cloudinary_cloud_name
    api_key    = var.cloudinary_api_key
    api_secret = var.cloudinary_api_secret
  })
}

# Redis Connection (optional)
resource "aws_secretsmanager_secret" "redis" {
  count       = var.redis_host != "" ? 1 : 0
  name        = "${var.project_name}/${var.environment}/redis"
  description = "Redis connection details for ${var.environment}"

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis" {
  count     = var.redis_host != "" ? 1 : 0
  secret_id = aws_secretsmanager_secret.redis[0].id
  secret_string = jsonencode({
    host = var.redis_host
    port = 6379
    url  = "redis://${var.redis_host}:6379"
  })
}
