import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Get users this user is following
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

        const following = await prisma.follow.findMany({
            where: { followerId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                following: {
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
            following: following.map((f: typeof following[number]) => f.following),
        });
    } catch (error) {
        console.error('Error getting following:', error);
        return NextResponse.json({ error: 'Failed to get following' }, { status: 500 });
    }
}
