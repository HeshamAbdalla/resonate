import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get all communities with stats
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'popular';
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        let orderBy: any = {};

        switch (sort) {
            case 'popular':
                orderBy = { subscribers: { _count: 'desc' } };
                break;
            case 'new':
                orderBy = { createdAt: 'desc' };
                break;
            case 'alphabetical':
                orderBy = { name: 'asc' };
                break;
            case 'active':
                orderBy = { posts: { _count: 'desc' } };
                break;
            default:
                orderBy = { subscribers: { _count: 'desc' } };
        }

        const communities = await prisma.community.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            } : undefined,
            orderBy,
            take: limit,
            include: {
                creator: {
                    select: { username: true },
                },
                _count: {
                    select: {
                        subscribers: true,
                        posts: true,
                    },
                },
            },
        });

        return NextResponse.json({ communities });
    } catch (error) {
        console.error('Error fetching communities:', error);
        return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
    }
}
