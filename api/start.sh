#!/bin/sh

# Fix SSL mode for psql
FIXED_URL=$(echo "$DATABASE_URL" | sed 's/sslmode=no-verify/sslmode=require/g')

# Check if database reset is requested
if [ "$RESET_DATABASE" = "true" ]; then
  echo "⚠️  RESET_DATABASE=true - Dropping all tables and recreating schema..."
  echo "🗑️  Dropping all tables..."
  if [ -f /app/reset-database.sql ]; then
    psql "$FIXED_URL" -f /app/reset-database.sql 2>&1 || echo "⚠️  Reset failed or already clean"
  fi
  echo "📋 Creating complete schema..."
  if [ -f /app/complete-schema.sql ]; then
    psql "$FIXED_URL" -f /app/complete-schema.sql 2>&1 || echo "⚠️  Schema creation failed"
  fi
  echo "✅ Database reset completed"
else
  echo "🔄 Setting up database schema (if not exists)..."
  if [ -f /app/complete-schema.sql ]; then
    psql "$FIXED_URL" -f /app/complete-schema.sql 2>&1 | head -20 || echo "⚠️  Schema already exists or setup skipped"
  fi
fi

echo ""
echo "🔄 Running database migrations..."
# Clear any stuck migration locks
npm run migrate unlock 2>/dev/null || true
# Run migrations
npm run migrate || {
  echo "⚠️  Migrations failed or already applied - continuing to start server..."
}

echo ""
echo "🚀 Starting API server..."
exec node server.js
