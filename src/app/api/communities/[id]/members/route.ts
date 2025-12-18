import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Search community members for moderator selection
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: communityIdOrSlug } = await params;
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        // Get community - try by id first, then by slug
        let community = await prisma.community.findUnique({
            where: { id: communityIdOrSlug },
            select: {
                id: true,
                creatorId: true,
                moderators: {
                    select: { userId: true }
                }
            }
        });

        // If not found by id, try by slug
        if (!community) {
            community = await prisma.community.findUnique({
                where: { slug: communityIdOrSlug },
                select: {
                    id: true,
                    creatorId: true,
                    moderators: {
                        select: { userId: true }
                    }
                }
            });
        }

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        const communityId = community.id;

        // Get existing moderator IDs to exclude
        const existingModIds = [
            community.creatorId,
            ...community.moderators.map((m: { userId: string }) => m.userId)
        ];

        // If query is provided, search ALL users by username (global search)
        if (query.length >= 2) {
            const users = await prisma.user.findMany({
                where: {
                    id: { notIn: existingModIds },
                    username: { contains: query, mode: 'insensitive' }
                },
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true
                },
                take: 15,
                orderBy: { reputation: 'desc' }
            });

            return NextResponse.json({ users });
        }

        // Get subscribers (community members) using the correct communityId
        const subscribers = await prisma.subscription.findMany({
            where: {
                communityId: communityId,
                userId: { notIn: existingModIds }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        reputation: true
                    }
                }
            },
            take: 30,
            orderBy: { joinedAt: 'desc' }
        });

        // If we have subscribers, return them
        if (subscribers.length > 0) {
            const users = subscribers.map(s => s.user);
            return NextResponse.json({ users });
        }

        // FALLBACK: If no subscribers found, return top users (excluding mods)
        const topUsers = await prisma.user.findMany({
            where: {
                id: { notIn: existingModIds }
            },
            select: {
                id: true,
                username: true,
                image: true,
                reputation: true
            },
            take: 20,
            orderBy: { reputation: 'desc' }
        });

        return NextResponse.json({ users: topUsers });
    } catch (error) {
        console.error('Error searching members:', error);
        return NextResponse.json({ error: 'Failed to search members' }, { status: 500 });
    }
}
