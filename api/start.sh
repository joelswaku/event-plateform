#!/bin/sh

echo "🔄 Running database migrations..."
npm run migrate || {
  echo "⚠️  Migrations failed or already applied - continuing to start server..."
}

echo "🚀 Starting API server..."
exec node server.js
