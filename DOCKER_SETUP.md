# Docker Setup Guide

Complete guide for Docker containerization of the Event Platform.

## Overview

The Event Platform uses Docker for:
- **Local Development** - via docker-compose
- **Production Deployment** - via AWS ECS Fargate

## Dockerfiles

### API Dockerfile ([api/Dockerfile](./api/Dockerfile))
- **Base Image:** `node:20-alpine`
- **Multi-stage build:** deps → development → production
- **Security:** Non-root user, health checks
- **Port:** 5000

### Web Dockerfile ([web/Dockerfile](./web/Dockerfile))
- **Base Image:** `node:20-alpine`
- **Next.js standalone output** for smaller images
- **Build args:** Public environment variables
- **Port:** 3000

### Vendors Dockerfile ([vendors/Dockerfile](./vendors/Dockerfile))
- Same structure as Web
- **Port:** 3001

## Local Development with Docker Compose

### Start All Services
```bash
docker-compose up
```

Services available at:
- **API:** http://localhost:5000
- **Web:** http://localhost:3000
- **Vendors:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379 (if enabled)

### Start Specific Service
```bash
docker-compose up api
docker-compose up web
```

### Rebuild After Changes
```bash
docker-compose up --build
```

### View Logs
```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
```

### Stop All Services
```bash
docker-compose down
```

### Clean Everything (Including Data)
```bash
docker-compose down -v
```

## Production Builds

### Build API
```bash
cd api
docker build -t event-platform-api .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  event-platform-api
```

### Build Web
```bash
cd web
docker build -t event-platform-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=... \
  .
docker run -p 3000:3000 event-platform-web
```

### Build Vendors
```bash
cd vendors
docker build -t event-platform-vendors \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  .
docker run -p 3001:3001 event-platform-vendors
```

## Next.js Configuration for Docker

### IMPORTANT: Enable Standalone Output

Edit `web/next.config.js` and `vendors/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Your existing config...
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables (public only)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
```

**Why standalone?**
- Reduces Docker image size from ~1.5GB to ~300MB
- Includes only production dependencies
- Faster container startup

### Public vs Private Environment Variables

**Build-time (public):**
```dockerfile
# In Dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

**Runtime (private - for API only):**
```bash
# Pass at container start
docker run -e JWT_SECRET=secret api-image
```

## Troubleshooting

### Issue: "Module not found" in Next.js container

**Cause:** Missing `output: 'standalone'` in next.config.js

**Fix:**
```javascript
module.exports = {
  output: 'standalone',
  // ...
}
```

### Issue: Environment variables undefined in browser

**Cause:** Need to use build args for `NEXT_PUBLIC_*` variables

**Fix:**
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

### Issue: Port already in use

**Fix:**
```bash
# Find process using port
lsof -i :5000  # or netstat -ano | findstr 5000 on Windows

# Kill it or change docker-compose ports
ports:
  - "5001:5000"  # Use different host port
```

### Issue: Database connection refused

**Cause:** Using `localhost` instead of service name

**Fix in docker-compose:**
```yaml
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/eventplatform
#                                              ^^^^^^^^ service name, not localhost
```

### Issue: Changes not reflecting

**Fix:**
```bash
# Rebuild images
docker-compose up --build

# Or force recreate
docker-compose up --force-recreate
```

### Issue: Out of disk space

**Fix:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything (careful!)
docker system prune -a --volumes
```

## Docker Best Practices

✅ **Implemented:**
- Multi-stage builds (smaller images)
- Non-root users (security)
- Health checks (reliability)
- .dockerignore (faster builds)
- Alpine base images (smaller size)
- Layer caching (faster builds)

### Image Sizes
- **API:** ~200MB (Node.js + dependencies)
- **Web:** ~300MB (Next.js standalone)
- **Vendors:** ~300MB (Next.js standalone)

### Build Time
- **First build:** 5-10 minutes (downloads everything)
- **Subsequent builds:** 30-60 seconds (cached layers)

## Deployment to ECR

See [scripts/build-and-deploy.sh](./scripts/build-and-deploy.sh) for automated deployment.

Manual steps:
```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Tag image
docker tag event-platform-api:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/event-platform-api:latest

# 3. Push image
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/event-platform-api:latest
```

## Security Considerations

### Running as Non-Root
All Dockerfiles create and use a non-root user:
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
USER appuser
```

### Secrets Management
❌ **Don't:**
```dockerfile
ENV JWT_SECRET=hardcoded_secret  # Don't hardcode secrets
```

✅ **Do:**
```bash
# Pass at runtime
docker run -e JWT_SECRET=$JWT_SECRET api-image

# Or use Docker secrets (Swarm)
docker service create --secret jwt_secret api-image
```

### Scanning for Vulnerabilities
```bash
# Scan image
docker scan event-platform-api

# Or use Trivy
trivy image event-platform-api
```

## CI/CD Integration

GitHub Actions automatically:
1. Builds Docker images
2. Scans for vulnerabilities (ECR)
3. Pushes to ECR
4. Updates ECS services

See [.github/workflows/](../.github/workflows/) for pipeline definitions.

## Development Tips

### Hot Reload in Docker
Volumes are configured for hot reload:
```yaml
volumes:
  - ./api:/app
  - /app/node_modules  # Don't overwrite node_modules
```

### Debug Mode
```bash
# Start with interactive shell
docker-compose run --rm api sh

# Or attach to running container
docker exec -it event-platform-api sh
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d eventplatform

# Or from host (if port is exposed)
psql postgresql://postgres:postgres@localhost:5432/eventplatform
```

### Inspect Logs
```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs api

# Follow logs
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 api
```

## Performance Optimization

### Reduce Build Time
1. **Order Dockerfile commands** - least to most frequently changing
2. **Use .dockerignore** - exclude unnecessary files
3. **Multi-stage builds** - separate build and runtime

### Reduce Image Size
1. **Alpine base images** - 5MB vs 100MB
2. **Multi-stage builds** - discard build dependencies
3. **Next.js standalone** - only production files

### Reduce Startup Time
1. **Health checks** - ensure service is ready
2. **Optimize dependencies** - remove unused packages
3. **Pre-warm caches** - build images with common data

## Useful Commands

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container_id>

# Execute command in container
docker exec -it <container_id> sh

# Inspect container
docker inspect <container_id>

# View container resource usage
docker stats

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Clean everything
docker system prune -a --volumes
```

## Next Steps

- [ ] Set up Docker Hub or AWS ECR
- [ ] Configure CI/CD pipelines
- [ ] Add Docker Compose override for team-specific settings
- [ ] Set up monitoring (Datadog, New Relic)
- [ ] Configure log aggregation (CloudWatch, ELK)
