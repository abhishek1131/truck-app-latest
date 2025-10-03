import cron from 'node-cron';

// Function to call the low stock email API
const callLowStockEmail = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/cron/low-stock');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Low stock email check completed:', data.message);
    } else {
      console.error('❌ Low stock email check failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error calling low stock API:', error);
  }
};

// Function to call the restock email API
const callRestockEmail = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/cron/restock');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Restock email check completed:', data.message);
    } else {
      console.error('❌ Restock email check failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error calling restock API:', error);
  }
};

// Cron job that runs every minute
const startCronJob = () => {
  console.log('🕐 Starting cron job...');
  
  cron.schedule('0 0 * * 0', async () => { // Schedule task to run every Sunday at midnight
  // cron.schedule('* * * * *', async () => {  // Schedule task to run every minute
    const now = new Date();
    console.log(`⏰ Cron job executed at: ${now.toISOString()}`);

    await callLowStockEmail();
    await callRestockEmail();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ Cron job scheduled successfully!');
};

// Export the function for use in other modules
export { startCronJob };

// If this file is run directly, start the cron job
if (import.meta.url === `file://${process.argv[1]}`) {
  startCronJob();
}
