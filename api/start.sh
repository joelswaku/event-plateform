#!/bin/sh

echo "🔄 Setting up complete database schema..."
if [ -f /app/complete-schema.sql ]; then
  # Replace no-verify with require for psql compatibility
  FIXED_URL=$(echo "$DATABASE_URL" | sed 's/sslmode=no-verify/sslmode=require/g')
  psql "$FIXED_URL" -f /app/complete-schema.sql 2>&1 | head -20 || echo "⚠️  Schema already exists or setup skipped"
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
