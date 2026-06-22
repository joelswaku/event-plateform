#!/bin/sh

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
