import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get community activity for the last 24 hours (hourly breakdown)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: communityId } = await params;

        // Get current time and 24 hours ago
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get posts from last 24 hours
        const posts = await prisma.post.findMany({
            where: {
                communityId,
                createdAt: { gte: yesterday },
            },
            select: { createdAt: true },
        });

        // Get comments from last 24 hours
        const comments = await prisma.comment.findMany({
            where: {
                post: { communityId },
                createdAt: { gte: yesterday },
            },
            select: { createdAt: true },
        });

        // Combine posts and comments (votes don't have timestamps)
        const allActivity: Date[] = [
            ...posts.map((p: { createdAt: Date }) => p.createdAt),
            ...comments.map((c: { createdAt: Date }) => c.createdAt),
        ];

        // Group by hour (24 buckets)
        const hourlyData: number[] = new Array(24).fill(0);
        allActivity.forEach((date: Date) => {
            const hourDiff = Math.floor((now.getTime() - date.getTime()) / (60 * 60 * 1000));
            if (hourDiff >= 0 && hourDiff < 24) {
                hourlyData[23 - hourDiff]++;
            }
        });

        // Calculate 24h totals for comparison
        const last12h = hourlyData.slice(12).reduce((a: number, b: number) => a + b, 0);
        const prev12h = hourlyData.slice(0, 12).reduce((a: number, b: number) => a + b, 0);
        const percentChange = prev12h > 0
            ? Math.round(((last12h - prev12h) / prev12h) * 100)
            : last12h > 0 ? 100 : 0;

        // Get users active in last 15 minutes (based on comments and recent posts)
        const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

        const recentPosts = await prisma.post.findMany({
            where: {
                communityId,
                createdAt: { gte: fifteenMinAgo },
            },
            select: { authorId: true },
            distinct: ['authorId'],
        });

        const recentComments = await prisma.comment.findMany({
            where: {
                post: { communityId },
                createdAt: { gte: fifteenMinAgo },
            },
            select: { authorId: true },
            distinct: ['authorId'],
        });

        const activeUsers = new Set([
            ...recentPosts.map((p: { authorId: string }) => p.authorId),
            ...recentComments.map((c: { authorId: string }) => c.authorId),
        ]);

        return NextResponse.json({
            hourlyActivity: hourlyData,
            percentChange,
            totalToday: hourlyData.reduce((a: number, b: number) => a + b, 0),
            onlineCount: activeUsers.size,
        });
    } catch (error) {
        console.error('Error fetching community activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
}
