import { spawn } from 'child_process';
import { startCronJob } from './lib/cron/cron.mjs';

console.log('🚀 Starting TruxTok application in production mode...');

// Start the cron job
startCronJob();

// Start the Next.js production server
const server = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  shell: true
});

// Handle server process events
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGTERM');
  process.exit(0);
});
