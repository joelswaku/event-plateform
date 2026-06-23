Write-Host "Exporting Local Database Schema..." -ForegroundColor Cyan
Write-Host ""

# Update these with your local database credentials
$LOCAL_DB_HOST = "localhost"
$LOCAL_DB_PORT = "5432"
$LOCAL_DB_NAME = "liteevent_development"  # Your local database name
$LOCAL_DB_USER = "postgres"               # Your local database user

Write-Host "This will export your local database schema to production-schema.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your local database details:" -ForegroundColor White
Write-Host "  Host: $LOCAL_DB_HOST" -ForegroundColor Gray
Write-Host "  Database: $LOCAL_DB_NAME" -ForegroundColor Gray
Write-Host "  User: $LOCAL_DB_USER" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Running pg_dump..." -ForegroundColor Cyan

# Export schema only (no data)
pg_dump -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME --schema-only --no-owner --no-privileges -f production-schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Schema exported to production-schema.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Upload this to production database" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ERROR: Export failed" -ForegroundColor Red
    Write-Host "Make sure pg_dump is installed and accessible in PATH" -ForegroundColor Yellow
}
