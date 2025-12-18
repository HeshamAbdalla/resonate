import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Get juror stats for the current user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create juror stats
        let stats = await prisma.jurorStats.findUnique({
            where: { userId: user.id },
        });

        if (!stats) {
            // Create default stats for new juror
            stats = await prisma.jurorStats.create({
                data: {
                    userId: user.id,
                    casesReviewed: 0,
                    guiltyVotes: 0,
                    innocentVotes: 0,
                    accuracy: 50.0,
                    rank: 'Novice Juror',
                },
            });
        }

        // Count pending cases available
        const pendingCount = await prisma.report.count({
            where: {
                status: 'pending',
                reporterId: { not: user.id },
                verdicts: {
                    none: { jurorId: user.id },
                },
            },
        });

        return NextResponse.json({
            casesReviewed: stats.casesReviewed,
            guiltyVotes: stats.guiltyVotes,
            innocentVotes: stats.innocentVotes,
            accuracy: stats.accuracy,
            rank: stats.rank,
            pendingCases: pendingCount,
        });
    } catch (error) {
        console.error('Error fetching juror stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
