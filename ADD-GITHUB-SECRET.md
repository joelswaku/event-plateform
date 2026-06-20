# Add DATABASE_URL to GitHub Secrets

## Step 1: Go to GitHub Secrets

https://github.com/joelswaku/event-plateform/settings/secrets/actions

## Step 2: Click "New repository secret"

## Step 3: Add this secret

**Name:**
```
DATABASE_URL
```

**Value:**
```
postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production
```

## Step 4: Click "Add secret"

## Done!

Now GitHub Actions will run migrations before deploying! 🚀
