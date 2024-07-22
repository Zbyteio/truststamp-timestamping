import cron, { ScheduledTask } from 'node-cron';
import { processGithubZip } from '@/utils/cron';
import { getAllEmails, getPassword, getCredential } from '@/utils/credentials';

interface ScheduledJobs {
    [key: string]: ScheduledTask;
}

let scheduledJobs: ScheduledJobs = {};

export async function scheduleCronJobs() {
    // Clear all existing jobs before scheduling new ones
    clearScheduledJobs();

    const emails = await getAllEmails();
    console.log('Emails to process:', emails);

    for (const email of emails) {
        if (!email.trim()) {
            console.log(`Skipping blank email entry.`);
            continue;
        }

        console.log(`Processing email: ${email}`);
        try {
            const password = await getPassword(email) || "";
            const timestampFrequency = await getCredential(email, 'timestampFrequency', 'value', password);

            // Schedule the cron job based on the timestampFrequency
            if (timestampFrequency) {
                scheduleCronJob(email, password, timestampFrequency);
            }

        } catch (error) {
            console.error(`Error processing email ${email}:`, error);
        }
    }
}

function scheduleCronJob(email: string, password: string, frequency: string) {
    let cronSchedule: string;

    switch (frequency.toLowerCase()) {
        case 'daily':
            cronSchedule = '0 0 * * *'; // Every 24 hours
            break;
        case 'weekly':
            cronSchedule = '0 0 * * 0'; // Every week
            break;
        case 'monthly':
            cronSchedule = '0 0 1 * *'; // Every month
            break;
        default:
            console.log(`Invalid frequency for ${email}: ${frequency}`);
            return;
    }

    const job: ScheduledTask = cron.schedule(cronSchedule, async () => {
        try {
            console.log(`Running scheduled task for ${email} with frequency ${frequency}`);
            await processGithubZip(email, password);
        } catch (error) {
            console.error(`Error processing email ${email} in scheduled task:`, error);
        }
    });

    scheduledJobs[email] = job;
    console.log(`Scheduled cron job for ${email} with frequency ${frequency}`);
}

function clearScheduledJobs() {
    console.log('Clearing all scheduled jobs');
    Object.values(scheduledJobs).forEach(job => job.stop());
    scheduledJobs = {};
}
