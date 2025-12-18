import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Get user's followers
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const followers = await prisma.follow.findMany({
            where: { followingId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                        bio: true,
                        reputation: true,
                    },
                },
            },
        });

        return NextResponse.json({
            followers: followers.map((f: typeof followers[number]) => f.follower),
        });
    } catch (error) {
        console.error('Error getting followers:', error);
        return NextResponse.json({ error: 'Failed to get followers' }, { status: 500 });
    }
}
