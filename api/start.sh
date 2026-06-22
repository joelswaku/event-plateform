#!/bin/sh

echo "🔄 Setting up database schema..."
node -e "
const { Client } = require('pg');
const fs = require('fs');

async function setup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const sql = fs.readFileSync('./setup-database.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Database schema ready');
  } catch (err) {
    console.log('⚠️  Schema setup skipped (already exists or error):', err.message);
  } finally {
    await client.end();
  }
}
setup();
" || echo "Schema setup completed"

echo "🔄 Running database migrations..."
npm run migrate || {
  echo "⚠️  Migrations failed or already applied - continuing to start server..."
}

echo "🚀 Starting API server..."
exec node server.js
