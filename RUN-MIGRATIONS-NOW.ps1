# Run migrations against AWS RDS database
# This creates all tables in your AWS database

Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
Write-Host ""

cd api

# Set DATABASE_URL to point to AWS RDS
$env:DATABASE_URL = "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production"

Write-Host "Database: AWS RDS (liteevent_production)" -ForegroundColor Yellow
Write-Host "Running migrations..." -ForegroundColor Yellow
Write-Host ""

npm run migrate

Write-Host ""
Write-Host "✅ Migrations completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Your AWS database now has all tables!" -ForegroundColor Cyan
