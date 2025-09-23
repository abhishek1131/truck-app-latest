const cron = require("node-cron");

let isInitialized = false;

// Initialize cron jobs
const initializeCronJobs = () => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log("🔄 Cron jobs already initialized, skipping...");
    return;
  }

  // Only run on server side
  if (typeof window !== 'undefined') {
    console.log("🌐 Skipping cron initialization on client side");
    return;
  }

  console.log("🕐 Initializing cron jobs...");
  
  // Example cron job that runs every minute
  // cron.schedule("*/1 * * * *", async () => {
  //   console.log("⏰ Cron job executed at:", new Date().toISOString());
  // });

  isInitialized = true;
  console.log("✅ Cron jobs initialized successfully!");
};

// Auto-start cron jobs when this module is imported (only on server)
if (typeof window === 'undefined') {
  initializeCronJobs();
}

module.exports = { initializeCronJobs };
