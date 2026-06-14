# 💰 LiteEvent Cost Optimization Strategy

## ECS Fargate Resource Allocation

### Current Configuration

```
API Service (Node.js + Express):
  CPU: 512 (0.5 vCPU)
  Memory: 1024MB (1GB)
  Min Tasks: 1
  Max Tasks: 5  ← Auto-scales under load
  Cost at min: ~$15/month
  Cost at max: ~$75/month

Web Service (Next.js):
  CPU: 256 (0.25 vCPU)  ← MINIMUM Fargate allows
  Memory: 512MB          ← MINIMUM Fargate allows
  Min Tasks: 1
  Max Tasks: 3  ← Auto-scales under load
  Cost at min: ~$7.50/month
  Cost at max: ~$22.50/month

Vendors Service (Next.js):
  CPU: 256 (0.25 vCPU)  ← MINIMUM Fargate allows
  Memory: 512MB          ← MINIMUM Fargate allows
  Min Tasks: 1
  Max Tasks: 2  ← Auto-scales under load
  Cost at min: ~$7.50/month
  Cost at max: ~$15/month

Total ECS Cost:
  At minimum (normal): ~$30/month
  At maximum (traffic spike): ~$112.50/month
  Average expected: ~$30-45/month
```

### Auto-Scaling Configuration

**API Service:**
```hcl
api_min_capacity = 1  # Start with 1 task (low cost)
api_max_capacity = 5  # Scale up to 5 during traffic spikes

# Scales when:
# - CPU > 70% for 2 minutes → add task
# - CPU < 30% for 5 minutes → remove task
```

**Web Service:**
```hcl
web_min_capacity = 1  # Start with 1 task (low cost)
web_max_capacity = 3  # Scale up to 3 during traffic spikes

# Scales when:
# - CPU > 70% for 2 minutes → add task
# - CPU < 30% for 5 minutes → remove task
# (Rarely scales due to CloudFront caching)
```

**Vendors Service:**
```hcl
vendors_min_capacity = 1  # Start with 1 task (low cost)
vendors_max_capacity = 2  # Scale up to 2 during traffic spikes

# Scales when:
# - CPU > 70% for 2 minutes → add task
# - CPU < 30% for 5 minutes → remove task
# (Rarely scales - vendors portal has low traffic)
```

### Why This Works for Launch

**API gets more resources:**
- Handles database queries
- Processes business logic
- Manages file uploads
- Needs 512 CPU + 1GB memory

**Web and Vendors get minimal resources:**
- Next.js static/SSG pages cached by CloudFront
- Server-side rendering happens occasionally
- Most traffic hits CloudFront cache (not ECS)
- 256 CPU + 512MB is sufficient for low traffic

**CloudFront does the heavy lifting:**
- 90%+ of requests served from edge cache
- ECS only hit for dynamic content
- This is why Web/Vendors can be so small

### When Auto-Scaling Triggers

**API will scale when:**
- Traffic spike (100+ concurrent API requests)
- Database queries take longer (high CPU)
- File upload processing (high CPU + memory)
- Expected: 1 task normally, 2-3 during busy hours, 5 during major event launches

**Web will scale when:**
- CloudFront cache hit ratio drops (more SSR)
- Traffic spike AND many cache misses
- Complex page rendering (server-side)
- Expected: 1 task 99% of the time, maybe 2 during viral traffic

**Vendors will scale when:**
- Multiple vendors using portal simultaneously
- Complex data exports/reports
- Expected: 1 task 99.9% of the time, rarely scales to 2

### Cost Impact

```
Normal day (1 task each):
  $30/month

Busy day (API: 2, Web: 1, Vendors: 1):
  $45/month average

Traffic spike (API: 3, Web: 2, Vendors: 1):
  $60/month if sustained

Maximum (API: 5, Web: 3, Vendors: 2):
  $112.50/month if sustained
  (But this is GOOD - means you have lots of users!)
```

**Key insight:** You only pay for extra tasks while they're running. If API scales to 5 tasks for 2 hours during an event launch, you only pay for those 2 hours, not the full month.

---

## Next.js Standalone Mode

### Configuration Required

**CRITICAL: You must configure Next.js for standalone output to reduce Docker image size.**

#### web/next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Your existing config
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
  },
}

module.exports = nextConfig
```

#### vendors/next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Your existing config
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
```

### Docker Configuration

**Your Dockerfile should use the standalone build:**

```dockerfile
# web/Dockerfile and vendors/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with standalone output
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (much smaller!)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Benefits of Standalone Mode

| Without Standalone | With Standalone | Savings |
|-------------------|-----------------|---------|
| 500-800MB image | 150-250MB image | 60-70% smaller |
| Slower pulls from ECR | Faster pulls | Better cold start |
| More storage cost | Less storage cost | ~$1/month |
| Includes dev dependencies | Production only | Cleaner |

---

## Cost Breakdown by Traffic Level

### Launch (0-100 users/day)

```
Current setup is optimal:
- CloudFront cache hit ratio: 90%+
- ECS gets minimal traffic
- Web/Vendors: 256 CPU + 512MB sufficient

Monthly cost: $30 (ECS) + $15 (CloudFront) = $45
```

### Growth (100-1,000 users/day)

```
Still optimal:
- CloudFront still handling 90%+ traffic
- ECS handles cache misses
- Might see occasional CPU spikes (fine)

Monthly cost: ~$45-50
Action: Monitor CPU/memory, no changes needed yet
```

### Scale (1,000-10,000 users/day)

```
Time to scale:
- Scale API to 2 tasks (high database load)
- Web/Vendors still 1 task each (CloudFront helps)
- Consider adding Redis for session management

Monthly cost: ~$60-80
Action: Scale API only, keep Web/Vendors at 1 task
```

### Heavy Traffic (10,000+ users/day)

```
Time to scale everything:
- API: 3-5 tasks, maybe upgrade to 1024 CPU + 2GB
- Web: 2 tasks, still 256 CPU + 512MB
- Vendors: 1-2 tasks, still 256 CPU + 512MB
- Enable Redis
- Enable Multi-AZ RDS

Monthly cost: ~$150-250
Action: Scale all services based on metrics
```

---

## When to Upgrade Resources

### API Service

**Upgrade from 512 CPU + 1GB to 1024 CPU + 2GB when:**
- CPU utilization > 80% sustained
- Memory > 90%
- Database connection pool exhausted
- Response times > 500ms

**Signs you need it:**
- Slow database queries
- High API latency
- Memory warnings in logs
- Connection timeouts

### Web Service

**Keep 256 CPU + 512MB unless:**
- CloudFront cache hit ratio drops below 80%
- Server-side rendering is slow (> 2 seconds)
- Memory > 90%
- You're doing heavy server-side processing

**Most likely: Never need to upgrade**
- CloudFront handles static assets
- ISR/SSG reduces SSR needs
- 256 CPU is enough for rendering

### Vendors Service

**Keep 256 CPU + 512MB unless:**
- Same reasons as Web
- Vendor portal gets heavy traffic
- Complex data grids/tables causing high CPU

**Most likely: Never need to upgrade**
- Even lower traffic than main web
- Mostly static vendor dashboards
- CloudFront caching helps

---

## Monitoring Strategy

### Key Metrics to Watch

**ECS CPU Utilization:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=liteevent-production-web-service Name=ClusterName,Value=liteevent-production-cluster \
  --statistics Average \
  --start-time 2026-06-12T00:00:00Z \
  --end-time 2026-06-12T23:59:59Z \
  --period 3600
```

**ECS Memory Utilization:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=liteevent-production-web-service Name=ClusterName,Value=liteevent-production-cluster \
  --statistics Average \
  --start-time 2026-06-12T00:00:00Z \
  --end-time 2026-06-12T23:59:59Z \
  --period 3600
```

**CloudFront Cache Hit Ratio:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=<YOUR_DISTRIBUTION_ID> \
  --statistics Average \
  --start-time 2026-06-12T00:00:00Z \
  --end-time 2026-06-12T23:59:59Z \
  --period 3600
```

### Set Up Alarms

```bash
# Web service high CPU (upgrade if this fires frequently)
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-web-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=liteevent-production-web-service Name=ClusterName,Value=liteevent-production-cluster

# Web service high memory (upgrade if this fires)
aws cloudwatch put-metric-alarm \
  --alarm-name liteevent-web-high-memory \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 3 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=liteevent-production-web-service Name=ClusterName,Value=liteevent-production-cluster
```

---

## Cost Optimization Checklist

### At Launch
- [ ] Next.js standalone mode enabled (web/vendors)
- [ ] Docker images optimized (150-250MB)
- [ ] Web: 256 CPU + 512MB (minimum)
- [ ] Vendors: 256 CPU + 512MB (minimum)
- [ ] API: 512 CPU + 1GB (sufficient)
- [ ] CloudFront caching configured
- [ ] 1 task per service
- [ ] No Redis
- [ ] Single-AZ RDS

**Expected cost: $30/month (ECS only)**

### At 1,000 Users
- [ ] Monitor CPU/memory metrics
- [ ] Check CloudFront cache hit ratio
- [ ] Keep current configuration if metrics good

**Expected cost: $30-40/month (ECS only)**

### At 5,000 Users
- [ ] Scale API to 2 tasks if needed
- [ ] Add Redis if using BullMQ
- [ ] Keep Web/Vendors at 1 task (CloudFront helps)

**Expected cost: $50-70/month (ECS + Redis)**

### At 10,000+ Users
- [ ] Scale API to 3-5 tasks
- [ ] Consider API CPU upgrade (1024 CPU + 2GB)
- [ ] Scale Web to 2 tasks if cache hit ratio drops
- [ ] Enable Multi-AZ RDS
- [ ] Add staging environment

**Expected cost: $150-250/month (full stack)**

---

## Why This Works

### CloudFront is the Secret

```
User Request
  ↓
CloudFront Edge (90%+ cache hits)
  ↓ (only 10% miss)
ALB
  ↓
ECS Web/Vendors (minimal traffic)
```

**Result:**
- Web/Vendors ECS tasks get very little traffic
- 256 CPU + 512MB handles the 10% cache misses easily
- Most requests never hit ECS
- Costs stay low

### Next.js Optimization

```
Build Process:
  npm run build (with output: 'standalone')
  ↓
  .next/standalone/ (production-only, no dev deps)
  ↓
  Docker image (150-250MB vs 500-800MB)
  ↓
  Faster ECR pulls
  ↓
  Faster cold starts
  ↓
  Lower costs
```

---

## Summary

**Current configuration is optimal for launch:**

| Service | CPU | Memory | Why |
|---------|-----|--------|-----|
| API | 512 | 1024MB | Database queries, business logic |
| Web | 256 | 512MB | CloudFront caches most traffic |
| Vendors | 256 | 512MB | CloudFront caches most traffic |

**Total ECS cost: ~$30/month**

**With CloudFront helping Web/Vendors, you can stay at 256 CPU + 512MB until 10,000+ users.**

**Next steps:**
1. Ensure Next.js standalone mode is enabled
2. Optimize Docker images
3. Monitor CPU/memory metrics
4. Scale only when metrics show need

---

**This is the most cost-effective ECS configuration for a low-traffic launch.**

**Don't upgrade until metrics show you need it.**
