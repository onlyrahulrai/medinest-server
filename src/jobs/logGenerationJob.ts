import Medicine from '../models/Medicine';
import { generateLogsForMedicine } from '../services/medicineLogService';
import { commonQueue } from './commonQueue';

export const setupLogGenerationJob = async () => {
  // Add repeatable job every day at midnight
  await commonQueue.add('generate-logs', {}, {
    repeat: {
      pattern: '0 0 * * *', // Every day at midnight
    },
  });
  console.log('✅ Log generation job scheduled daily at midnight');
};

export const processLogGeneration = async () => {
  console.log('[LogEngine] Starting daily log generation for all active medicines');
  const activeMedicines = await Medicine.find({ isActive: true });

  for (const medicine of activeMedicines) {
    try {
      // Generate logs for next 7 days (to keep them rolling)
      await generateLogsForMedicine(String(medicine._id), 7);
    } catch (error) {
      console.error(`[LogEngine] Failed to generate logs for medicine ${medicine._id}:`, error);
    }
  }
  console.log(`[LogEngine] Completed log generation for ${activeMedicines.length} medicines`);
};
