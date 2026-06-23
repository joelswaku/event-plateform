#!/bin/bash
# ECS Service Investigation Script
# Run this to gather diagnostic data

REGION="us-east-1"
CLUSTER="liteevent-production-cluster"
SERVICE="liteevent-production-api-service"
TASK_DEF="liteevent-production-api-task:1"

echo "=========================================="
echo "ECS SERVICE INVESTIGATION"
echo "=========================================="
echo ""

# 1. Get Service Details
echo "1. SERVICE DETAILS"
echo "==================="
aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION \
  --output json

echo ""
echo "2. RECENT TASKS (STOPPED)"
echo "========================="
STOPPED_TASKS=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --desired-status STOPPED \
  --region $REGION \
  --max-items 5 \
  --query 'taskArns' \
  --output json)

echo "Stopped task ARNs: $STOPPED_TASKS"

if [ "$STOPPED_TASKS" != "[]" ]; then
  echo ""
  echo "STOPPED TASK DETAILS:"
  aws ecs describe-tasks \
    --cluster $CLUSTER \
    --tasks $(echo $STOPPED_TASKS | jq -r '.[]' | head -1) \
    --region $REGION \
    --output json
fi

echo ""
echo "3. RUNNING TASKS"
echo "================"
RUNNING_TASKS=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --desired-status RUNNING \
  --region $REGION \
  --query 'taskArns' \
  --output json)

echo "Running task ARNs: $RUNNING_TASKS"

if [ "$RUNNING_TASKS" != "[]" ]; then
  aws ecs describe-tasks \
    --cluster $CLUSTER \
    --tasks $(echo $RUNNING_TASKS | jq -r '.[]' | head -1) \
    --region $REGION \
    --output json
fi

echo ""
echo "4. TASK DEFINITION"
echo "=================="
aws ecs describe-task-definition \
  --task-definition $TASK_DEF \
  --region $REGION \
  --output json

echo ""
echo "5. CLOUDWATCH LOGS (Last 50 lines)"
echo "==================================="
LOG_GROUP="/ecs/liteevent-production/api"
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name $LOG_GROUP \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region $REGION \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null)

if [ ! -z "$LATEST_STREAM" ]; then
  echo "Log stream: $LATEST_STREAM"
  aws logs get-log-events \
    --log-group-name $LOG_GROUP \
    --log-stream-name "$LATEST_STREAM" \
    --limit 50 \
    --region $REGION \
    --output json | jq -r '.events[] | .message'
else
  echo "No log streams found"
fi

echo ""
echo "6. TARGET GROUP HEALTH"
echo "======================"
# Get target groups for this cluster
TG_ARNS=$(aws elbv2 describe-target-groups \
  --region $REGION \
  --query 'TargetGroups[?contains(TargetGroupName, `liteevent-production-api`)].TargetGroupArn' \
  --output text)

for TG in $TG_ARNS; do
  echo "Target Group: $TG"
  aws elbv2 describe-target-health \
    --target-group-arn $TG \
    --region $REGION \
    --output json
done

echo ""
echo "7. RDS CONNECTIVITY CHECK"
echo "========================="
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --region $REGION \
  --query 'DBInstances[?contains(DBInstanceIdentifier, `liteevent-production`)].Endpoint.Address' \
  --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"

# Get RDS security group
RDS_SG=$(aws rds describe-db-instances \
  --region $REGION \
  --query 'DBInstances[?contains(DBInstanceIdentifier, `liteevent-production`)].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

echo "RDS Security Group: $RDS_SG"

# Get ECS security group
ECS_SG=$(aws ec2 describe-security-groups \
  --region $REGION \
  --filters "Name=group-name,Values=*ecs-tasks*" \
  --query 'SecurityGroups[?contains(GroupName, `liteevent-production`)].GroupId' \
  --output text)

echo "ECS Security Group: $ECS_SG"

# Check RDS security group inbound rules
echo ""
echo "RDS Security Group Inbound Rules:"
aws ec2 describe-security-groups \
  --group-ids $RDS_SG \
  --region $REGION \
  --query 'SecurityGroups[0].IpPermissions' \
  --output json

echo ""
echo "8. SECRETS MANAGER"
echo "=================="
# Check if secrets exist
SECRETS=("liteevent/production/database" "liteevent/production/jwt" "liteevent/production/stripe" "liteevent/production/google-oauth")

for SECRET in "${SECRETS[@]}"; do
  echo "Checking: $SECRET"
  aws secretsmanager describe-secret \
    --secret-id $SECRET \
    --region $REGION \
    --query '{Name:Name,LastChanged:LastChangedDate}' \
    --output json 2>/dev/null || echo "  ❌ NOT FOUND"
done

echo ""
echo "9. TASK DEFINITION ANALYSIS"
echo "==========================="
aws ecs describe-task-definition \
  --task-definition $TASK_DEF \
  --region $REGION \
  --query 'taskDefinition.{CPU:cpu,Memory:memory,ContainerDefinitions:containerDefinitions[0].{Image:image,Environment:environment,Secrets:secrets,HealthCheck:healthCheck}}' \
  --output json

echo ""
echo "=========================================="
echo "INVESTIGATION COMPLETE"
echo "=========================================="
