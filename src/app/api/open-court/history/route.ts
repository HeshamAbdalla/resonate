export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Get the user's verdict history
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all verdicts by this user with report details
        const verdicts = await prisma.verdict.findMany({
            where: { jurorId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                report: {
                    select: {
                        id: true,
                        reason: true,
                        targetType: true,
                        targetId: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Enrich with target content info
        const enrichedHistory = await Promise.all(
            verdicts.map(async (verdict: any) => {
                let targetInfo: { author: string; preview: string; community: string } | null = null;

                if (verdict.report.targetType === 'post') {
                    const post = await prisma.post.findUnique({
                        where: { id: verdict.report.targetId },
                        select: {
                            title: true,
                            author: { select: { username: true } },
                            community: { select: { name: true } },
                        },
                    });
                    if (post) {
                        targetInfo = {
                            author: post.author.username,
                            preview: post.title.slice(0, 100),
                            community: post.community.name,
                        };
                    }
                } else if (verdict.report.targetType === 'comment') {
                    const comment = await prisma.comment.findUnique({
                        where: { id: verdict.report.targetId },
                        select: {
                            content: true,
                            author: { select: { username: true } },
                            post: { select: { community: { select: { name: true } } } },
                        },
                    });
                    if (comment) {
                        targetInfo = {
                            author: comment.author.username,
                            preview: comment.content.slice(0, 100),
                            community: comment.post.community.name,
                        };
                    }
                }

                // Get final outcome
                const totalVerdicts = await prisma.verdict.count({
                    where: { reportId: verdict.report.id },
                });
                const guiltyVotes = await prisma.verdict.count({
                    where: { reportId: verdict.report.id, vote: 'guilty' },
                });

                return {
                    id: verdict.id,
                    reportId: verdict.report.id,
                    vote: verdict.vote,
                    votedAt: verdict.createdAt.toISOString(),
                    reason: verdict.report.reason,
                    targetType: verdict.report.targetType,
                    status: verdict.report.status,
                    targetInfo,
                    outcome: {
                        total: totalVerdicts,
                        guilty: guiltyVotes,
                        innocent: totalVerdicts - guiltyVotes,
                        wasCorrect: verdict.report.status === 'reviewed'
                            ? verdict.vote === 'guilty'
                            : verdict.report.status === 'dismissed'
                                ? verdict.vote === 'innocent'
                                : null, // Still pending
                    },
                };
            })
        );

        return NextResponse.json({ history: enrichedHistory });
    } catch (error) {
        console.error('Error fetching verdict history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
