#!/usr/bin/env node

// Startup script that initializes cron jobs and starts the Next.js server
console.log('🚀 Starting application with cron jobs...');

// Initialize cron jobs first
try {
  require('ts-node/register');
  require('../lib/cron/cron.ts');
  console.log('✅ Cron jobs initialized successfully!');
} catch (error) {
  console.error('❌ Failed to initialize cron jobs:', error);
}

// Start Next.js development server
const { spawn } = require('child_process');

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const command = isDev ? 'next' : 'next';
const args = isDev ? ['dev'] : ['start'];

console.log(`🔄 Starting Next.js ${isDev ? 'development' : 'production'} server...`);

const nextProcess = spawn('npx', [command, ...args], {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js server:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`📝 Next.js server exited with code ${code}`);
  process.exit(code);
});
