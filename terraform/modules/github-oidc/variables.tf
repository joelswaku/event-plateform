variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "ecr_repository_arns" {
  description = "List of ECR repository ARNs that GitHub Actions can push to"
  type        = list(string)
}

variable "ecs_task_role_arns" {
  description = "List of ECS task execution role ARNs that GitHub Actions can pass"
  type        = list(string)
}

variable "enable_secrets_access" {
  description = "Enable GitHub Actions to read secrets from Secrets Manager"
  type        = bool
  default     = false
}
