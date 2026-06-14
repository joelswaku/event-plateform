output "images_bucket_name" {
  description = "Images S3 bucket name"
  value       = aws_s3_bucket.images.id
}

output "images_bucket_arn" {
  description = "Images S3 bucket ARN"
  value       = aws_s3_bucket.images.arn
}

output "assets_bucket_name" {
  description = "Assets S3 bucket name"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_id" {
  description = "Assets S3 bucket ID"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "Assets S3 bucket ARN"
  value       = aws_s3_bucket.assets.arn
}
