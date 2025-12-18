import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// POST - Follow/unfollow a user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user to follow
        const targetUser = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Can't follow yourself
        if (targetUser.id === user.id) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: targetUser.id,
                },
            },
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: { id: existingFollow.id },
            });
            return NextResponse.json({ following: false, message: 'Unfollowed' });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followingId: targetUser.id,
                },
            });
            return NextResponse.json({ following: true, message: 'Followed' });
        }
    } catch (error) {
        console.error('Error following user:', error);
        return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }
}

// GET - Check if current user is following this user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Find the target user
        const targetUser = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                    },
                },
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let isFollowing = false;
        if (user && user.id !== targetUser.id) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: targetUser.id,
                    },
                },
            });
            isFollowing = !!follow;
        }

        return NextResponse.json({
            isFollowing,
            followersCount: targetUser._count.followers,
            followingCount: targetUser._count.following,
        });
    } catch (error) {
        console.error('Error getting follow status:', error);
        return NextResponse.json({ error: 'Failed to get follow status' }, { status: 500 });
    }
}
