output "database_secret_arn" {
  description = "ARN of the database secret"
  value       = aws_secretsmanager_secret.database.arn
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt.arn
}

output "stripe_secret_arn" {
  description = "ARN of the Stripe secret"
  value       = aws_secretsmanager_secret.stripe.arn
}

output "google_oauth_secret_arn" {
  description = "ARN of the Google OAuth secret"
  value       = aws_secretsmanager_secret.google_oauth.arn
}

# Resend removed - using SES only

output "cloudinary_secret_arn" {
  description = "ARN of the Cloudinary secret"
  value       = var.cloudinary_cloud_name != "" ? aws_secretsmanager_secret.cloudinary[0].arn : ""
}

output "redis_secret_arn" {
  description = "ARN of the Redis secret"
  value       = var.redis_host != "" ? aws_secretsmanager_secret.redis[0].arn : ""
}

output "all_secret_arns" {
  description = "List of all secret ARNs for ECS task IAM policy"
  value = concat(
    [
      aws_secretsmanager_secret.database.arn,
      aws_secretsmanager_secret.jwt.arn,
      aws_secretsmanager_secret.stripe.arn,
      aws_secretsmanager_secret.google_oauth.arn
    ],
    var.cloudinary_cloud_name != "" ? [aws_secretsmanager_secret.cloudinary[0].arn] : [],
    var.redis_host != "" ? [aws_secretsmanager_secret.redis[0].arn] : []
  )
}
