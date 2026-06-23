# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-${var.environment}/api"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project_name}-${var.environment}/web"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-web-logs"
  }
}

resource "aws_cloudwatch_log_group" "vendors" {
  name              = "/ecs/${var.project_name}-${var.environment}/vendors"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-vendors-logs"
  }
}

# ECS Exec Log Group
resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/ecs/${var.project_name}-${var.environment}/exec"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-exec-logs"
  }
}

# ========================================
# IAM Roles
# ========================================

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy for Secrets Manager access (task execution role needs this to pull secrets)
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-${var.environment}-ecs-execution-secrets-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secret_arns
      }
    ]
  })
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Policy for S3 access
resource "aws_iam_role_policy" "ecs_task_s3_policy" {
  name = "${var.project_name}-${var.environment}-ecs-task-s3-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.images_bucket_name}",
          "arn:aws:s3:::${var.images_bucket_name}/*"
        ]
      }
    ]
  })
}

# Policy for SES access
resource "aws_iam_role_policy" "ecs_task_ses_policy" {
  name = "${var.project_name}-${var.environment}-ecs-task-ses-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for ECS Exec (SSM)
resource "aws_iam_role_policy" "ecs_task_exec_policy" {
  name = "${var.project_name}-${var.environment}-ecs-task-exec-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs_exec.arn}:*"
      }
    ]
  })
}

# ========================================
# Security Groups
# ========================================

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  }
}

# Allow ECS to access RDS
resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.db_security_group_id
  source_security_group_id = aws_security_group.ecs_tasks.id
  description              = "Allow ECS tasks to access RDS"
}

# Allow ECS to access Redis (if enabled)
resource "aws_security_group_rule" "redis_from_ecs" {
  count                    = var.redis_host != "" ? 1 : 0
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = var.redis_security_group_id
  source_security_group_id = aws_security_group.ecs_tasks.id
  description              = "Allow ECS tasks to access Redis"
}

# ========================================
# API Task Definition & Service
# ========================================
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-${var.environment}-api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${var.ecr_api_repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "5000" },
        { name = "AWS_S3_BUCKET", value = var.images_bucket_name },
        { name = "AWS_REGION", value = data.aws_region.current.name },
        { name = "CORS_ORIGIN", value = "https://liteevent.com,https://vendors.liteevent.com,https://api.liteevent.com" },
        { name = "FRONTEND_URL", value = "https://liteevent.com" },
        { name = "VENDOR_APP_URL", value = "https://vendors.liteevent.com" }
      ]

      # Secrets from AWS Secrets Manager
      secrets = concat([
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.database_secret_arn}:url::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.jwt_secret_arn}:jwt_secret::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${var.jwt_secret_arn}:jwt_refresh_secret::"
        },
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = "${var.stripe_secret_arn}:secret_key::"
        },
        {
          name      = "STRIPE_WEBHOOK_SECRET"
          valueFrom = "${var.stripe_secret_arn}:webhook_secret::"
        },
        {
          name      = "STRIPE_STARTER_PRICE_ID"
          valueFrom = "${var.stripe_secret_arn}:starter_price_id::"
        },
        {
          name      = "STRIPE_PRO_PRICE_ID"
          valueFrom = "${var.stripe_secret_arn}:pro_price_id::"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "${var.google_oauth_secret_arn}:client_secret::"
        }
        # RESEND_API_KEY removed - using SES instead
      ],
      var.redis_secret_arn != "" ? [
        {
          name      = "REDIS_URL"
          valueFrom = "${var.redis_secret_arn}:url::"
        }
      ] : [],
      var.anthropic_secret_arn != "" ? [
        {
          name      = "ANTHROPIC_API_KEY"
          valueFrom = "${var.anthropic_secret_arn}:api_key::"
        }
      ] : [])

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-api-task"
  }
}

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-${var.environment}-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.environment == "production" ? 2 : 1
  launch_type     = "FARGATE"

  # Enable ECS Exec
  enable_execute_command = true

  # Give container time to start and become healthy
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_api_arn
    container_name   = "api"
    container_port   = 5000
  }

  # deployment_configuration {
  #   maximum_percent         = 200
  #   minimum_healthy_percent = 100
  # }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution_role_policy]

  tags = {
    Name = "${var.project_name}-${var.environment}-api-service"
  }
}

# Auto Scaling for API
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 10
  min_capacity       = var.environment == "production" ? 2 : 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.project_name}-${var.environment}-api-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# ========================================
# WEB Task Definition & Service
# ========================================
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-${var.environment}-web-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "web"
      image     = "${var.ecr_web_repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "NEXT_PUBLIC_API_URL", value = "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.web.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-web-task"
  }
}

resource "aws_ecs_service" "web" {
  name            = "${var.project_name}-${var.environment}-web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.environment == "production" ? 2 : 1
  launch_type     = "FARGATE"

  # Enable ECS Exec
  enable_execute_command = true

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_web_arn
    container_name   = "web"
    container_port   = 3000
  }

  # deployment_configuration {
  #   maximum_percent         = 200
  #   minimum_healthy_percent = 100
  # }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution_role_policy]

  tags = {
    Name = "${var.project_name}-${var.environment}-web-service"
  }
}

# ========================================
# VENDORS Task Definition & Service
# ========================================
resource "aws_ecs_task_definition" "vendors" {
  family                   = "${var.project_name}-${var.environment}-vendors-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "vendors"
      image     = "${var.ecr_vendors_repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "NEXT_PUBLIC_API_URL", value = "http://liteevent-production-alb-976548681.us-east-1.elb.amazonaws.com" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.vendors.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-vendors-task"
  }
}

resource "aws_ecs_service" "vendors" {
  name            = "${var.project_name}-${var.environment}-vendors-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.vendors.arn
  desired_count   = var.environment == "production" ? 2 : 1
  launch_type     = "FARGATE"

  # Enable ECS Exec
  enable_execute_command = true

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_vendors_arn
    container_name   = "vendors"
    container_port   = 3001
  }

  # deployment_configuration {
  #   maximum_percent         = 200
  #   minimum_healthy_percent = 100
  # }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution_role_policy]

  tags = {
    Name = "${var.project_name}-${var.environment}-vendors-service"
  }
}

data "aws_region" "current" {}
