import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get public mod actions for this community
        const actions = await prisma.modAction.findMany({
            where: {
                communityId: id,
                isPublic: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                moderator: {
                    select: { username: true },
                },
            },
        });

        return NextResponse.json({ actions });
    } catch (error) {
        console.error('Error fetching mod log:', error);
        return NextResponse.json({ error: 'Failed to fetch mod log' }, { status: 500 });
    }
}
