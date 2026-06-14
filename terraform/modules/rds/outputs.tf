output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
