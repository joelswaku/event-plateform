# ⚡ LiteEvent Auto-Scaling Configuration

## Summary

Start with **1 task per service** (minimum cost), auto-scale when traffic increases.

---

## Configuration

### API Service (High Priority)

```hcl
# Resource allocation
cpu    = 512   # 0.5 vCPU
memory = 1024  # 1 GB

# Auto-scaling
api_min_capacity = 1  # Normal traffic
api_max_capacity = 5  # Peak traffic

# Scaling triggers
scale_up_when:
  - CPU > 70% for 2 minutes
  - Memory > 80% for 2 minutes
  - ALB target response time > 1 second

scale_down_when:
  - CPU < 30% for 5 minutes
  - Memory < 40% for 5 minutes
```

**Why 1-5 tasks:**
- 1 task: Handles 100-500 API requests/minute
- 2 tasks: 500-1,000 requests/minute
- 3 tasks: 1,000-2,000 requests/minute
- 5 tasks: 2,000+ requests/minute (major event launch)

**Cost:**
- 1 task: $15/month
- 5 tasks: $75/month (only during spike)

---

### Web Service (CloudFront Cached)

```hcl
# Resource allocation
cpu    = 256  # 0.25 vCPU (MINIMUM)
memory = 512  # 512 MB (MINIMUM)

# Auto-scaling
web_min_capacity = 1  # Normal traffic
web_max_capacity = 3  # Peak traffic

# Scaling triggers
scale_up_when:
  - CPU > 70% for 2 minutes
  - CloudFront cache hit ratio < 80%
  - ALB target response time > 2 seconds

scale_down_when:
  - CPU < 30% for 5 minutes
  - CloudFront cache hit ratio > 90%
```

**Why 1-3 tasks:**
- 1 task: Handles 90%+ of traffic (CloudFront caches)
- 2 tasks: CloudFront cache hit ratio dropped
- 3 tasks: Viral traffic + many cache misses

**Cost:**
- 1 task: $7.50/month
- 3 tasks: $22.50/month (rare)

**Expected:** 1 task 99% of the time

---

### Vendors Service (Lowest Traffic)

```hcl
# Resource allocation
cpu    = 256  # 0.25 vCPU (MINIMUM)
memory = 512  # 512 MB (MINIMUM)

# Auto-scaling
vendors_min_capacity = 1  # Normal traffic
vendors_max_capacity = 2  # Peak traffic

# Scaling triggers
scale_up_when:
  - CPU > 70% for 2 minutes
  - Multiple vendors using portal

scale_down_when:
  - CPU < 30% for 5 minutes
```

**Why 1-2 tasks:**
- 1 task: Handles all vendor portal traffic
- 2 tasks: Many vendors exporting data simultaneously

**Cost:**
- 1 task: $7.50/month
- 2 tasks: $15/month (very rare)

**Expected:** 1 task 99.9% of the time

---

## Cost Scenarios

### Scenario 1: Normal Day (Most Days)

```
API: 1 task
Web: 1 task
Vendors: 1 task

Cost: $30/month
```

**Traffic handled:**
- 100-500 API requests/minute
- 10,000+ web page views/day
- 10-50 vendor logins/day

---

### Scenario 2: Busy Day (Weekends/Events)

```
API: 2 tasks (auto-scaled)
Web: 1 task (CloudFront helps)
Vendors: 1 task

Cost: $45/month average
```

**Traffic handled:**
- 500-1,000 API requests/minute
- 50,000+ web page views/day
- 50-100 vendor logins/day

---

### Scenario 3: Traffic Spike (Major Event Launch)

```
API: 3-5 tasks (auto-scaled)
Web: 2 tasks (some cache misses)
Vendors: 1 task

Cost: $60-75/month if sustained
      (But spike only lasts hours, not full month)
```

**Traffic handled:**
- 1,000-2,000+ API requests/minute
- 100,000+ web page views/day
- Event registration rush

**Important:** You only pay for the hours the extra tasks are running!

If API scales to 5 tasks for 2 hours:
- Extra cost: (4 extra tasks × 2 hours) / 730 hours = ~$1.64
- Not $60/month extra, just $1.64 for that spike

---

### Scenario 4: Maximum (Viral Growth)

```
API: 5 tasks (max)
Web: 3 tasks (max)
Vendors: 2 tasks (max)

Cost: $112.50/month if sustained
```

**This is GOOD news:**
- You have massive traffic
- You're making money
- Infrastructure cost is still cheap
- Time to celebrate and add Redis!

---

## Auto-Scaling Metrics

### CloudWatch Alarms

**API Scale Up:**
```bash
# Alarm fires when CPU > 70% for 2 minutes
# Auto-scaling adds 1 task
# Can add up to 4 more tasks (max 5)
```

**API Scale Down:**
```bash
# Alarm fires when CPU < 30% for 5 minutes
# Auto-scaling removes 1 task
# Never goes below 1 task (min)
```

**Web/Vendors:**
```bash
# Same logic as API
# Rarely triggers due to CloudFront caching
```

---

## When to Adjust Limits

### Increase API Max (5 → 10)

**When:**
- Hitting 5 tasks frequently (> 4 hours/day)
- Revenue > $10,000/month
- Can afford higher peaks

**Impact:** Can handle 4,000+ requests/minute

### Increase Web Max (3 → 5)

**When:**
- CloudFront cache hit ratio < 80% sustained
- Complex SSR pages causing high CPU
- Revenue > $10,000/month

**Impact:** Can handle more cache misses

### Increase Vendors Max (2 → 3)

**When:**
- Many vendors using portal simultaneously
- Complex reporting/exports causing high CPU
- 100+ active vendors

**Impact:** Can handle more concurrent vendors

---

## Monitoring

### Check Current Task Count

```bash
# API
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-api-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'

# Web
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-web-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'

# Vendors
aws ecs describe-services \
  --cluster liteevent-production-cluster \
  --services liteevent-production-vendors-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'
```

### Check Auto-Scaling History

```bash
# View scaling events for API
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/liteevent-production-cluster/liteevent-production-api-service \
  --max-results 10
```

### Monthly Cost by Task Count

```bash
# Get average task count for the month
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name RunningTaskCount \
  --dimensions Name=ServiceName,Value=liteevent-production-api-service Name=ClusterName,Value=liteevent-production-cluster \
  --start-time 2026-06-01T00:00:00Z \
  --end-time 2026-06-30T23:59:59Z \
  --period 86400 \
  --statistics Average
```

---

## Configuration Files

### Terraform Configuration

Add these to `terraform/environments/production/terraform.tfvars`:

```hcl
# API auto-scaling
api_min_capacity = 1
api_max_capacity = 5

# Web auto-scaling
web_min_capacity = 1
web_max_capacity = 3

# Vendors auto-scaling
vendors_min_capacity = 1
vendors_max_capacity = 2
```

### ECS Module Variables

Already configured in `terraform/modules/ecs/main.tf`:

```hcl
resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.api_max_capacity
  min_capacity       = var.api_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.project_name}-${var.environment}-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 120
  }
}
```

---

## Summary

**Start cheap, scale automatically:**

| Service | Min | Max | Normal | Cost |
|---------|-----|-----|--------|------|
| API | 1 | 5 | 1-2 | $15-30/month |
| Web | 1 | 3 | 1 | $7.50/month |
| Vendors | 1 | 2 | 1 | $7.50/month |

**Total: $30-45/month normal, $112.50/month peak**

**Key benefits:**
- ✅ Starts at minimum cost ($30/month)
- ✅ Automatically handles traffic spikes
- ✅ Scales down when traffic drops
- ✅ Only pay for what you use
- ✅ No manual intervention needed

**When to increase limits:**
- API hitting max 5 tasks regularly
- Revenue > $10,000/month
- Can afford higher peaks

---

**Auto-scaling configured. Launch and let it handle the traffic! 🚀**
