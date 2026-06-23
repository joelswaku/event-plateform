# Quick script to check ECS logs
aws logs tail /ecs/liteevent-production/api --since 5m --format short
