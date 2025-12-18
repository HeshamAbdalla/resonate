import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Get user's conversation notifications (new replies)
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all followed posts with new activity
        const followedPosts = await prisma.followedPost.findMany({
            where: { userId: user.id },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        community: { select: { slug: true } },
                        _count: { select: { comments: true } },
                    },
                },
            },
        });

        // Calculate new replies for each
        const notifications = followedPosts
            .map((fp: any) => ({
                postId: fp.post.id,
                postTitle: fp.post.title,
                communitySlug: fp.post.community.slug,
                newReplies: fp.post._count.comments - fp.lastSeenCount,
                followedAt: fp.followedAt.toISOString(),
            }))
            .filter((n: any) => n.newReplies > 0) // Only show posts with new activity
            .sort((a, b) => b.newReplies - a.newReplies);

        const totalNewReplies = notifications.reduce((sum, n) => sum + n.newReplies, 0);

        return NextResponse.json({
            notifications,
            totalNewReplies,
            count: notifications.length,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST - Mark notifications as seen (update lastSeenCount)
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all followed posts and update their seen counts
        const followedPosts = await prisma.followedPost.findMany({
            where: { userId: user.id },
            include: {
                post: {
                    select: {
                        id: true,
                        _count: { select: { comments: true } },
                    },
                },
            },
        });

        // Update each to current comment count
        await Promise.all(
            followedPosts.map((fp: any) =>
                prisma.followedPost.update({
                    where: { id: fp.id },
                    data: {
                        lastSeenCount: fp.post._count.comments,
                        lastViewedAt: new Date(),
                    },
                })
            )
        );

        return NextResponse.json({ message: 'Notifications marked as seen' });
    } catch (error) {
        console.error('Error marking notifications as seen:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
