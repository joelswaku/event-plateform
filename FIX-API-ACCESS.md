# Fix API Public Access - AWS Console

## Step 1: Check Load Balancer
1. Go to: https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#LoadBalancers:
2. Find: `liteevent-production-alb`
3. Copy the **DNS name** (should look like: `liteevent-production-alb-123456789.us-east-1.elb.amazonaws.com`)
4. **Test it**: Open in browser: `http://[DNS-NAME]/health`

## Step 2: If ALB DNS doesn't work - Check ALB Security Group
1. Go to: https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#SecurityGroups:
2. Search for: `liteevent-production-alb-sg`
3. Click on it
4. Check **Inbound rules** tab:
   - Should have: `HTTP (80)` from `0.0.0.0/0` ✅
   - Should have: `HTTPS (443)` from `0.0.0.0/0` ✅
5. If missing, click **Edit inbound rules** → **Add rule**:
   - Type: `HTTP`
   - Source: `0.0.0.0/0`
   - Save

## Step 3: Check ECS Tasks are Running
1. Go to: https://console.aws.amazon.com/ecs/v2/clusters/liteevent-production-cluster/services?region=us-east-1
2. Click `liteevent-production-api-service`
3. Check:
   - **Desired tasks**: Should be `1` or more
   - **Running tasks**: Should match desired
4. If tasks are 0:
   - Click **Update**
   - Set **Desired tasks** to `1`
   - Click **Update**

## Step 4: Check Target Group Health
1. Go to: https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#TargetGroups:
2. Find: `liteevent-production-api-tg`
3. Click on it
4. Go to **Targets** tab
5. Check status:
   - Should show `healthy` ✅
   - If `unhealthy` or `draining`: Check ECS task logs
   - If no targets: ECS service isn't registering tasks

## Step 5: Test API Endpoint
Once Load Balancer DNS is copied:

```
http://[ALB-DNS-NAME]/health
http://[ALB-DNS-NAME]/api/
```

## What's the Issue?

The API is **NOT private** - it's correctly configured to be public through the Load Balancer:
- ✅ ALB is internet-facing (not internal)
- ✅ ALB security group allows 0.0.0.0/0
- ✅ ECS tasks only accept traffic from ALB (secure!)

**Most likely issues:**
1. **No ECS tasks running** → Need to start the API service
2. **Unhealthy targets** → API container is failing health checks
3. **Migration issue** → API can't start because database migrations fail

## Quick Fix
If no tasks are running, the deploy from earlier should fix it once approved in GitHub Actions!
