import { NextRequest, NextResponse } from 'next/server';
import { scheduleCronJobs } from '@/utils/scheduleCron'; // Update the path as needed

let jobsScheduled = false;

export async function GET(req: NextRequest) {
    if (!jobsScheduled && req.nextUrl.searchParams.has('cron')) {
        await scheduleCronJobs().catch((error) => {
            console.error('Error scheduling cron jobs:', error);
        });
        jobsScheduled = true;
    }
    return NextResponse.json({ message: 'Cron jobs scheduled' });
}
