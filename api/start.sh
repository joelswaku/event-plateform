#!/bin/sh

# Fix SSL mode for psql
FIXED_URL=$(echo "$DATABASE_URL" | sed 's/sslmode=no-verify/sslmode=require/g')

# ── DB readiness: wait up to 30s for PostgreSQL to accept connections ──────
echo "⏳ Waiting for database to be reachable..."
PGCONNECT_TIMEOUT=5
DB_READY=0
for i in $(seq 1 6); do
  if PGCONNECT_TIMEOUT=$PGCONNECT_TIMEOUT psql "$FIXED_URL" -c "SELECT 1" > /dev/null 2>&1; then
    DB_READY=1
    break
  fi
  echo "  attempt $i/6 — retrying in 5s..."
  sleep 5
done

if [ "$DB_READY" = "0" ]; then
  echo "⚠️  Database not reachable after 30s — starting server anyway (health check may fail initially)"
fi

# Check if database reset is requested
if [ "$RESET_DATABASE" = "true" ]; then
  echo "⚠️  RESET_DATABASE=true - Dropping all tables and recreating schema..."
  echo "🗑️  Dropping all tables..."
  if [ -f /app/reset-database.sql ]; then
    PGCONNECT_TIMEOUT=10 psql "$FIXED_URL" -f /app/reset-database.sql 2>&1 || echo "⚠️  Reset failed or already clean"
  fi
  echo "📋 Creating complete schema..."
  if [ -f /app/complete-schema.sql ]; then
    PGCONNECT_TIMEOUT=10 psql "$FIXED_URL" -f /app/complete-schema.sql 2>&1 || echo "⚠️  Schema creation failed"
  fi
  echo "✅ Database reset completed - skipping migrations (schema is complete)"
else
  echo "🔄 Setting up database schema (if not exists)..."
  if [ -f /app/complete-schema.sql ]; then
    PGCONNECT_TIMEOUT=10 psql "$FIXED_URL" -f /app/complete-schema.sql 2>&1 | head -20 || echo "⚠️  Schema already exists or setup skipped"
  fi

  echo ""
  echo "🔄 Running database migrations..."
  # Clear any stuck migration locks
  npm run migrate unlock 2>/dev/null || true
  # Run migrations (non-fatal — CI already ran them)
  npm run migrate || echo "⚠️  Migrations failed or already applied - continuing to start server..."
fi

echo ""
echo "🚀 Starting API server..."
exec node server.js
