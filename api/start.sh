#!/bin/sh
set -e

echo "🔄 Setting up database schema..."
node setup-db-task.js || echo "⚠️  Schema already exists or setup skipped"

echo ""
echo "🔄 Running database migrations..."
npm run migrate || {
  echo "⚠️  Migrations failed or already applied - continuing..."
}

echo ""
echo "🚀 Starting API server..."
exec node server.js
