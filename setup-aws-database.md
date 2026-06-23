# Setup AWS RDS Database

## Problem
Your local database works but AWS RDS is empty (no tables).

## Solution
Run migrations to create tables in AWS RDS.

---

## Option 1: Run Migrations Locally (Easiest)

### Step 1: Create a temporary `.env` file for AWS

```bash
cd C:\projects\event-plateform\api
```

Create a file called `.env.aws` with this content:

```env
DATABASE_URL=postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production
NODE_ENV=production
```

### Step 2: Run migrations against AWS database

```bash
# Load AWS environment and run migrations
$env:DATABASE_URL="postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
npm run migrate
```

This will create all tables in AWS RDS!

---

## Option 2: Run Migrations via ECS Exec (Advanced)

If you can't connect from local (firewall/network issues):

### Step 1: Update RDS Security Group

Add your IP to RDS security group:
1. Go to: https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:
2. Search: `liteevent-production-rds-sg`
3. Click "Edit inbound rules"
4. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: My IP
5. Click "Save rules"

### Step 2: Connect via ECS Exec

```bash
# Get the running task ID
aws ecs list-tasks --cluster liteevent-production-cluster --service-name liteevent-production-api-service

# Connect to the container
aws ecs execute-command \
  --cluster liteevent-production-cluster \
  --task <TASK_ID> \
  --container api \
  --interactive \
  --command "/bin/sh"

# Inside the container, run migrations
npm run migrate
```

---

## Option 3: Add Migration to GitHub Actions (Automated)

Update `.github/workflows/deploy-production.yml` to run migrations after deploy.

Add this step after "Deploy API to ECS":

```yaml
- name: Run Database Migrations
  run: |
    # Get the task ARN
    TASK_ARN=$(aws ecs list-tasks \
      --cluster liteevent-production-cluster \
      --service-name liteevent-production-api-service \
      --query 'taskArns[0]' \
      --output text)
    
    # Wait for task to be running
    aws ecs wait tasks-running \
      --cluster liteevent-production-cluster \
      --tasks $TASK_ARN
    
    # Run migrations via ECS Exec
    aws ecs execute-command \
      --cluster liteevent-production-cluster \
      --task $TASK_ARN \
      --container api \
      --interactive \
      --command "npm run migrate"
```

---

## Verify Migrations Ran Successfully

After running migrations, check the database:

```bash
# Connect to database
psql "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"

# List all tables
\dt

# You should see:
# - users
# - events
# - tickets
# - vendors
# - etc...
```

---

## What Happens Next

After migrations run:
1. ✅ AWS RDS will have all tables
2. ✅ API container will connect successfully
3. ✅ No more "Database connection failed" errors
4. ✅ API will be fully functional

---

## Recommended: Option 1 (Run Locally)

**Easiest and fastest!** Just run:

```powershell
cd C:\projects\event-plateform\api
$env:DATABASE_URL="postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"
npm run migrate
```

Done! 🎉
