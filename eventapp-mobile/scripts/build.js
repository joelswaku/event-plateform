#!/usr/bin/env node

/**
 * Build script for LiteEvent Mobile
 * Helps manage environment variables and build profiles
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILES = {
  dev: 'development',
  preview: 'preview',
  prod: 'production',
};

const PLATFORMS = ['ios', 'android', 'all'];

function loadEnvFile(envFile) {
  const envPath = path.join(__dirname, '..', envFile);
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  Warning: ${envFile} not found`);
    return;
  }

  console.log(`✓ Loading ${envFile}`);
  const envContent = fs.readFileSync(envPath, 'utf8');

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      process.env[key] = values.join('=').trim();
    }
  });
}

function validateEnvironment(profile) {
  const requiredVars = {
    production: [
      'EXPO_PUBLIC_API_URL',
      'EXPO_PUBLIC_WEB_URL',
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    ],
    preview: [
      'EXPO_PUBLIC_API_URL',
    ],
    development: [],
  };

  const missing = requiredVars[profile].filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${profile}:`);
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error(`\nPlease create .env.${profile} with the required variables.`);
    process.exit(1);
  }
}

function runBuild(profile, platform) {
  console.log(`\n🚀 Building ${profile} for ${platform}...\n`);

  // Load appropriate env file
  const envMap = {
    development: '.env.development',
    preview: '.env.staging',
    production: '.env.production',
  };

  loadEnvFile(envMap[profile]);
  validateEnvironment(profile);

  // Build command
  const profileArg = profile === 'production' && platform !== 'all'
    ? `production-${platform}`
    : profile;

  const cmd = `eas build --profile ${profileArg} --platform ${platform}`;

  console.log(`📦 Running: ${cmd}\n`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\n✅ Build submitted successfully!`);
    console.log(`\n📱 Track your build: https://expo.dev/builds`);
  } catch (error) {
    console.error(`\n❌ Build failed`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
LiteEvent Mobile - Build Helper

Usage:
  node scripts/build.js <profile> <platform>

Profiles:
  dev      - Development build with local API
  preview  - Preview build with staging API
  prod     - Production build with live API

Platforms:
  ios      - Build for iOS only
  android  - Build for Android only
  all      - Build for both platforms (default)

Examples:
  node scripts/build.js dev ios
  node scripts/build.js preview all
  node scripts/build.js prod android

NPM Shortcuts:
  npm run build:dev           - Development build (all platforms)
  npm run build:preview:ios   - Preview build (iOS only)
  npm run build:prod:android  - Production build (Android only)
`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const [profileArg, platformArg = 'all'] = args;

if (!profileArg) {
  console.error('❌ Profile required');
  showHelp();
  process.exit(1);
}

const profile = PROFILES[profileArg];
if (!profile) {
  console.error(`❌ Invalid profile: ${profileArg}`);
  showHelp();
  process.exit(1);
}

const platform = platformArg.toLowerCase();
if (!PLATFORMS.includes(platform)) {
  console.error(`❌ Invalid platform: ${platform}`);
  showHelp();
  process.exit(1);
}

runBuild(profile, platform);
