import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// POST - Follow a conversation
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: postId } = await context.params;

        // Check post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { _count: { select: { comments: true } } },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if already following
        const existing = await prisma.followedPost.findUnique({
            where: {
                userId_postId: { userId: user.id, postId },
            },
        });

        if (existing) {
            return NextResponse.json({ following: true, message: 'Already following' });
        }

        // Create follow
        await prisma.followedPost.create({
            data: {
                userId: user.id,
                postId,
                lastSeenCount: post._count.comments,
            },
        });

        return NextResponse.json({ following: true, message: 'Now following this conversation' });
    } catch (error) {
        console.error('Error following post:', error);
        return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
    }
}

// DELETE - Unfollow a conversation
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: postId } = await context.params;

        await prisma.followedPost.deleteMany({
            where: { userId: user.id, postId },
        });

        return NextResponse.json({ following: false, message: 'Unfollowed' });
    } catch (error) {
        console.error('Error unfollowing post:', error);
        return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
    }
}

// GET - Check follow status
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ following: false });
        }

        const { id: postId } = await context.params;

        const follow = await prisma.followedPost.findUnique({
            where: {
                userId_postId: { userId: user.id, postId },
            },
        });

        return NextResponse.json({ following: !!follow });
    } catch (error) {
        console.error('Error checking follow status:', error);
        return NextResponse.json({ following: false });
    }
}
