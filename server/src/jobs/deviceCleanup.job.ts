import cron from 'node-cron';
import { DeviceManagementService } from '../services/deviceManagement.service';

/**
 * Cleanup job to remove old inactive devices
 * Runs daily at 2:00 AM
 */
export const startDeviceCleanupJob = () => {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting device cleanup job...');
      
      const deletedCount = await DeviceManagementService.cleanupOldDevices();
      
      console.log(`Device cleanup completed. Removed ${deletedCount} old devices.`);
    } catch (error) {
      console.error('Error in device cleanup job:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('Device cleanup job scheduled to run daily at 2:00 AM UTC');
};

/**
 * Manual cleanup function for testing
 */
export const runDeviceCleanupNow = async () => {
  try {
    console.log('Running manual device cleanup...');
    
    const deletedCount = await DeviceManagementService.cleanupOldDevices();
    
    console.log(`Manual cleanup completed. Removed ${deletedCount} old devices.`);
    return deletedCount;
  } catch (error) {
    console.error('Error in manual device cleanup:', error);
    throw error;
  }
};