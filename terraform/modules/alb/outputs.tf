output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "target_group_api_arn" {
  description = "API target group ARN"
  value       = aws_lb_target_group.api.arn
}

output "target_group_web_arn" {
  description = "Web target group ARN"
  value       = aws_lb_target_group.web.arn
}

output "target_group_vendors_arn" {
  description = "Vendors target group ARN"
  value       = aws_lb_target_group.vendors.arn
}
