export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Simple toxicity analysis based on keywords
function analyzeContent(text: string): { toxicityScore: number; flaggedKeywords: string[]; confidence: string } {
    const toxicWords = [
        'stupid', 'idiot', 'dumb', 'moron', 'hate', 'kill', 'die', 'ugly',
        'loser', 'pathetic', 'disgusting', 'trash', 'garbage', 'worthless',
        'shut up', 'get out', 'go away', 'nobody cares', 'you suck',
        'fake', 'scam', 'spam', 'click here', 'link in bio', '1000x',
        'crypto', 'nft', 'free money', 'guaranteed'
    ];

    const lowerText = text.toLowerCase();
    const flaggedKeywords: string[] = [];
    let toxicityScore = 0;

    toxicWords.forEach(word => {
        if (lowerText.includes(word)) {
            flaggedKeywords.push(word);
            toxicityScore += 15;
        }
    });

    // Check for ALL CAPS (aggressive)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 10) {
        toxicityScore += 20;
        flaggedKeywords.push('EXCESSIVE CAPS');
    }

    // Check for excessive punctuation
    if ((text.match(/[!?]{2,}/g) || []).length > 0) {
        toxicityScore += 10;
    }

    toxicityScore = Math.min(100, toxicityScore);

    let confidence = 'Low';
    if (flaggedKeywords.length >= 3) confidence = 'High';
    else if (flaggedKeywords.length >= 1) confidence = 'Medium';

    return { toxicityScore, flaggedKeywords: flaggedKeywords.slice(0, 5), confidence };
}

// GET - Get pending cases for the juror to review
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pending reports that this user hasn't voted on yet
        const pendingReports = await prisma.report.findMany({
            where: {
                status: 'pending',
                reporterId: { not: user.id }, // Can't review your own reports
                verdicts: {
                    none: { jurorId: user.id }, // Haven't voted yet
                },
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
        });

        // Enrich reports with target content
        const enrichedCases = await Promise.all(
            pendingReports.map(async (report: any) => {
                let content = null;
                let context = null;
                let aiAnalysis = { toxicityScore: 0, flaggedKeywords: [] as string[], confidence: 'Low' };

                if (report.targetType === 'post') {
                    const post = await prisma.post.findUnique({
                        where: { id: report.targetId },
                        include: {
                            author: { select: { username: true } },
                            community: { select: { name: true, slug: true } },
                        },
                    });
                    if (post) {
                        const fullText = post.title + (post.content ? '\n\n' + post.content : '');
                        content = {
                            author: post.author.username,
                            text: fullText,
                            timestamp: getTimeAgo(post.createdAt),
                            type: 'Post' as const,
                            community: post.community.name,
                        };
                        aiAnalysis = analyzeContent(fullText);
                    }
                } else if (report.targetType === 'comment') {
                    const comment = await prisma.comment.findUnique({
                        where: { id: report.targetId },
                        include: {
                            author: { select: { username: true } },
                            post: {
                                select: {
                                    title: true,
                                    community: { select: { name: true } }
                                }
                            },
                        },
                    });
                    if (comment) {
                        content = {
                            author: comment.author.username,
                            text: comment.content,
                            timestamp: getTimeAgo(comment.createdAt),
                            type: 'Comment' as const,
                            community: comment.post.community.name,
                        };
                        context = {
                            postTitle: comment.post.title,
                        };
                        aiAnalysis = analyzeContent(comment.content);
                    }
                }

                // Count current verdicts
                const verdictCounts = await prisma.verdict.groupBy({
                    by: ['vote'],
                    where: { reportId: report.id },
                    _count: true,
                });

                const guiltyCount = verdictCounts.find((v: any) => v.vote === 'guilty')?._count || 0;
                const innocentCount = verdictCounts.find((v: any) => v.vote === 'innocent')?._count || 0;

                return {
                    id: report.id,
                    reason: report.reason,
                    description: report.description,
                    reporter: 'Community Member', // Anonymized for privacy
                    createdAt: report.createdAt.toISOString(),
                    content,
                    context,
                    aiAnalysis,
                    verdictCounts: { guilty: guiltyCount, innocent: innocentCount },
                };
            })
        );

        // Filter out cases where content was deleted
        const validCases = enrichedCases.filter((c: any) => c.content !== null);

        return NextResponse.json({ cases: validCases });
    } catch (error) {
        console.error('Error fetching cases:', error);
        return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}
