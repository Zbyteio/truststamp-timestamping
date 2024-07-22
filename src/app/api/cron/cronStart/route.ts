import { NextRequest, NextResponse } from 'next/server';
import { scheduleCronJobs } from '@/utils/scheduleCron'; // Update the path as needed

export async function GET(req: NextRequest) {
    if (req.nextUrl.searchParams.has('cron')) {
        await scheduleCronJobs().catch((error) => {
            console.error('Error scheduling cron jobs:', error);
        });
    }
    return NextResponse.json({ message: 'Cron jobs scheduled' });
}
