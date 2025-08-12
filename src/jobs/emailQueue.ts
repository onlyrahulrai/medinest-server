import { Queue } from 'bullmq';

const connection = {
  connection: {
    host: '127.0.0.1',
    port: 6379,
  },
};

export const emailQueue = new Queue('emailQueue', connection);
