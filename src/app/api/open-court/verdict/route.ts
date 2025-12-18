import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// POST - Submit a verdict on a case
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reportId, vote } = await request.json();

        if (!reportId || !vote || !['guilty', 'innocent'].includes(vote)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Check if report exists and is pending
        const report = await prisma.report.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status !== 'pending') {
            return NextResponse.json({ error: 'Case already closed' }, { status: 400 });
        }

        // Can't vote on your own report
        if (report.reporterId === user.id) {
            return NextResponse.json({ error: 'Cannot vote on your own report' }, { status: 400 });
        }

        // Check if already voted
        const existingVote = await prisma.verdict.findUnique({
            where: {
                reportId_jurorId: {
                    reportId,
                    jurorId: user.id,
                },
            },
        });

        if (existingVote) {
            return NextResponse.json({ error: 'Already voted on this case' }, { status: 400 });
        }

        // Create verdict
        await prisma.verdict.create({
            data: {
                reportId,
                jurorId: user.id,
                vote,
            },
        });

        // Update or create juror stats
        await prisma.jurorStats.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                casesReviewed: 1,
                guiltyVotes: vote === 'guilty' ? 1 : 0,
                innocentVotes: vote === 'innocent' ? 1 : 0,
                accuracy: 50.0,
                rank: 'Novice Juror',
            },
            update: {
                casesReviewed: { increment: 1 },
                guiltyVotes: vote === 'guilty' ? { increment: 1 } : undefined,
                innocentVotes: vote === 'innocent' ? { increment: 1 } : undefined,
            },
        });

        // Check if we have enough verdicts to close the case (e.g., 5 votes)
        const totalVerdicts = await prisma.verdict.count({
            where: { reportId },
        });

        if (totalVerdicts >= 5) {
            // Count votes
            const guiltyVotes = await prisma.verdict.count({
                where: { reportId, vote: 'guilty' },
            });
            const innocentVotes = totalVerdicts - guiltyVotes;

            // Determine outcome (majority wins)
            const finalVerdict = guiltyVotes > innocentVotes ? 'guilty' : 'dismissed';

            // Update report status
            await prisma.report.update({
                where: { id: reportId },
                data: { status: finalVerdict === 'guilty' ? 'reviewed' : 'dismissed' },
            });

            // If guilty, take action on the content
            if (finalVerdict === 'guilty') {
                if (report.targetType === 'post') {
                    // Delete the post
                    await prisma.post.delete({
                        where: { id: report.targetId },
                    }).catch(() => {
                        // Post may have already been deleted
                    });
                } else if (report.targetType === 'comment') {
                    // Delete the comment
                    await prisma.comment.delete({
                        where: { id: report.targetId },
                    }).catch(() => {
                        // Comment may have already been deleted
                    });
                }
            }
        }

        // Get updated stats
        const stats = await prisma.jurorStats.findUnique({
            where: { userId: user.id },
        });

        // Calculate rank based on cases reviewed
        let rank = 'Novice Juror';
        if (stats) {
            if (stats.casesReviewed >= 100) rank = 'Chief Justice';
            else if (stats.casesReviewed >= 50) rank = 'Senior Juror';
            else if (stats.casesReviewed >= 20) rank = 'Juror';
            else if (stats.casesReviewed >= 5) rank = 'Junior Juror';

            // Update rank if changed
            if (stats.rank !== rank) {
                await prisma.jurorStats.update({
                    where: { userId: user.id },
                    data: { rank },
                });
            }
        }

        return NextResponse.json({
            success: true,
            vote,
            stats: stats ? {
                casesReviewed: stats.casesReviewed,
                guiltyVotes: stats.guiltyVotes,
                innocentVotes: stats.innocentVotes,
                accuracy: stats.accuracy,
                rank,
            } : null,
        });
    } catch (error) {
        console.error('Error submitting verdict:', error);
        return NextResponse.json({ error: 'Failed to submit verdict' }, { status: 500 });
    }
}
