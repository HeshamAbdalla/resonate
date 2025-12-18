import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - List blocked users
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const blockedUsers = await prisma.blockedUser.findMany({
            where: { blockerId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Get user info for blocked users
        const blockedIds = blockedUsers.map((b: any) => b.blockedId);
        const users = await prisma.user.findMany({
            where: { id: { in: blockedIds } },
            select: { id: true, username: true, name: true, image: true },
        });

        const userMap = new Map(users.map((u: any) => [u.id, u]));

        const result = blockedUsers.map((b: any) => ({
            id: b.id,
            blockedAt: b.createdAt.toISOString(),
            reason: b.reason,
            user: userMap.get(b.blockedId) || { id: b.blockedId, username: 'Unknown' },
        }));

        return NextResponse.json({ blockedUsers: result });
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
    }
}

// POST - Block a user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, reason } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (userId === user.id) {
            return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already blocked
        const existing = await prisma.blockedUser.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: user.id,
                    blockedId: userId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
        }

        // Create block
        const block = await prisma.blockedUser.create({
            data: {
                blockerId: user.id,
                blockedId: userId,
                reason,
            },
        });

        return NextResponse.json({
            success: true,
            block: {
                id: block.id,
                blockedAt: block.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
    }
}

// DELETE - Unblock a user
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete block
        await prisma.blockedUser.deleteMany({
            where: {
                blockerId: user.id,
                blockedId: userId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
    }
}
