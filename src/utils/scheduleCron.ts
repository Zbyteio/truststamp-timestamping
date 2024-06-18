import cron from 'node-cron';
import { processGithubZip } from '@/utils/cron';
import { getAllEmails, getCredential } from '@/utils/credentials';

export async function scheduleCronJobs() {
    const emails = getAllEmails();
    console.log('Emails to process:', emails);

    for (const email of emails) {
        if (!email.trim()) {
            console.log(`Skipping blank email entry.`);
            continue;
        }

        console.log(`Processing email: ${email}`);
        try {
            const response = await fetch(`${process.env.NEXTAUTH_URL}/api/database/password?email=${encodeURIComponent(email)}`);
            if (!response.ok) {
                console.log(`Failed to fetch password for ${email}`);
                continue;
            }

            const data = await response.json();
            const password = data.password;
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

    cron.schedule(cronSchedule, async () => {
        try {
            console.log(`Running scheduled task for ${email} with frequency ${frequency}`);
            await processGithubZip(email, password);
        } catch (error) {
            console.error(`Error processing email ${email} in scheduled task:`, error);
        }
    });

    console.log(`Scheduled cron job for ${email} with frequency ${frequency}`);
}