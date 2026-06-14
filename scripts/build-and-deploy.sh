#!/bin/bash
# Build and deploy all services to AWS ECR + ECS

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="event-platform-production-cluster"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Event Platform - Build & Deploy Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Login to ECR
echo -e "\n${YELLOW}[1/5] Logging into AWS ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 2: Build and push API
echo -e "\n${YELLOW}[2/5] Building and pushing API image...${NC}"
cd api
docker build -t event-platform-api .
docker tag event-platform-api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-api:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-api:latest
cd ..

# Step 3: Build and push Web
echo -e "\n${YELLOW}[3/5] Building and pushing Web image...${NC}"
cd web
docker build -t event-platform-web \
  --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.yourdomain.com} \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
  .
docker tag event-platform-web:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-web:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-web:latest
cd ..

# Step 4: Build and push Vendors
echo -e "\n${YELLOW}[4/5] Building and pushing Vendors image...${NC}"
cd vendors
docker build -t event-platform-vendors \
  --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.yourdomain.com} \
  .
docker tag event-platform-vendors:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-vendors:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/event-platform-vendors:latest
cd ..

# Step 5: Update ECS services
echo -e "\n${YELLOW}[5/5] Updating ECS services...${NC}"

echo "Updating API service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service event-platform-production-api-service \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager

echo "Updating Web service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service event-platform-production-web-service \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager

echo "Updating Vendors service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service event-platform-production-vendors-service \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\nMonitor deployment status:"
echo -e "  ${YELLOW}aws ecs describe-services --cluster $CLUSTER_NAME --services event-platform-production-api-service${NC}"
echo -e "\nView logs:"
echo -e "  ${YELLOW}aws logs tail /ecs/event-platform-production/api --follow${NC}"
