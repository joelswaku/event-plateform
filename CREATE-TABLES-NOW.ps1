Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CREATE ALL PRODUCTION DATABASE TABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Connect to your production RDS database" -ForegroundColor White
Write-Host "2. Create ALL tables (users, events, tickets, vendors, etc.)" -ForegroundColor White
Write-Host "3. Add all indexes and constraints" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Getting database credentials from AWS..." -ForegroundColor Cyan

# Get the secret from AWS Secrets Manager
$secret = aws secretsmanager get-secret-value `
    --secret-id "liteevent/production/database" `
    --region us-east-1 `
    --query SecretString `
    --output text 2>$null

if (-not $secret) {
    Write-Host "ERROR: Could not get database credentials from AWS Secrets Manager" -ForegroundColor Red
    Write-Host "Make sure AWS CLI is installed and configured" -ForegroundColor Yellow
    exit 1
}

$secretObj = $secret | ConvertFrom-Json
$dbUrl = $secretObj.url

Write-Host "Database URL retrieved!" -ForegroundColor Green
Write-Host ""

# Create a temporary Node.js script to run the SQL
$setupScript = @"
const { Client } = require('pg');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL;

async function setup() {
  console.log('Connecting to production database...');
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('Connected!');

    console.log('Reading SQL schema file...');
    const sql = fs.readFileSync('./api/setup-database.sql', 'utf8');

    console.log('Creating tables...');
    await client.query(sql);

    console.log('');
    console.log('SUCCESS! All tables created!');
    console.log('');
    console.log('Tables created:');
    console.log('- users');
    console.log('- events');
    console.log('- issued_tickets');
    console.log('- vendors');
    console.log('- organizers');
    console.log('- notifications');
    console.log('- webhook_events');
    console.log('- feature_flags');
    console.log('- audit_logs');
    console.log('- and more...');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
"@

Set-Content -Path "setup-temp.js" -Value $setupScript

Write-Host "Running database setup..." -ForegroundColor Cyan
Write-Host ""

$env:DATABASE_URL = $dbUrl
node setup-temp.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "DATABASE SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your production database now has all tables!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next: Force update the ECS service to restart with the new schema" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Setup failed - see errors above" -ForegroundColor Red
}

Remove-Item "setup-temp.js" -ErrorAction SilentlyContinue
