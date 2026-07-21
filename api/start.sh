#!/bin/sh

echo "🚀 Starting API server (skipping DB checks - Railway handles readiness)..."

# Skip migrations - just start the server
exec node server.js
