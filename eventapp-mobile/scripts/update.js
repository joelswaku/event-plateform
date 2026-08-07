#!/usr/bin/env node

/**
 * OTA Update script for LiteEvent Mobile
 * Push over-the-air updates to preview or production channels
 */

const { execSync } = require('child_process');
const readline = require('readline');

const CHANNELS = {
  preview: 'preview',
  prod: 'production',
};

function promptForMessage() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Update message (describe the changes): ', (message) => {
      rl.close();
      resolve(message || 'Update');
    });
  });
}

async function publishUpdate(channel, message) {
  console.log(`\n📤 Publishing OTA update to ${channel}...\n`);

  const cmd = `eas update --branch ${channel} --message "${message}"`;

  console.log(`Running: ${cmd}\n`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\n✅ Update published successfully!`);
    console.log(`\n📱 Users on ${channel} will receive this update on next app launch.`);
  } catch (error) {
    console.error(`\n❌ Update failed`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
LiteEvent Mobile - OTA Update Helper

Usage:
  node scripts/update.js <channel> [message]

Channels:
  preview  - Push to preview/staging channel
  prod     - Push to production channel

Examples:
  node scripts/update.js preview "Fix: Resolved QR scanner crash"
  node scripts/update.js prod "Feature: Added event sharing"

NPM Shortcuts:
  npm run update:preview  - Update preview channel
  npm run update:prod     - Update production channel

Important:
  - OTA updates work for JavaScript changes only
  - Native code changes require a new build
  - Changes to app.json require a new build
  - New permissions require a new build

What can be updated OTA:
  ✓ Bug fixes in JS code
  ✓ UI changes
  ✓ New screens/features (JS only)
  ✓ Assets (images, fonts)

What requires a new build:
  ✗ Native module changes
  ✗ New permissions
  ✗ app.json/app.config.ts changes
  ✗ Expo SDK version upgrades
`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const [channelArg, ...messageArgs] = args;

  if (!channelArg) {
    console.error('❌ Channel required');
    showHelp();
    process.exit(1);
  }

  const channel = CHANNELS[channelArg];
  if (!channel) {
    console.error(`❌ Invalid channel: ${channelArg}`);
    showHelp();
    process.exit(1);
  }

  let message = messageArgs.join(' ');

  if (!message) {
    message = await promptForMessage();
  }

  if (!message) {
    console.error('❌ Update message required');
    process.exit(1);
  }

  await publishUpdate(channel, message);
}

main();
