import { NextApiRequest, NextApiResponse } from 'next';
import { scheduleCronJobs } from '@/utils/scheduleCron'; // Update the path as needed

let jobsScheduled = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!jobsScheduled) {
        await scheduleCronJobs().catch((error) => {
            console.error('Error scheduling cron jobs:', error);
        });
        jobsScheduled = true;
    }
    res.status(200).json({ message: 'Cron jobs scheduled' });
}