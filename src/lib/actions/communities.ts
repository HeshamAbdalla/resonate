'use server';

import prisma from '@/lib/db';

export type CommunityWithStats = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    bannerImage: string | null;
    iconImage: string | null;
    rules: string | null;
    createdAt: Date;
    creator: {
        id: string;
        username: string;
    };
    _count: {
        posts: number;
        subscribers: number;
    };
};

export async function getCommunities(limit = 20): Promise<CommunityWithStats[]> {
    const communities = await prisma.community.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    posts: true,
                    subscribers: true,
                },
            },
        },
    });

    return communities;
}

export async function getCommunityBySlug(slug: string): Promise<CommunityWithStats | null> {
    const community = await prisma.community.findUnique({
        where: { slug },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    posts: true,
                    subscribers: true,
                },
            },
        },
    });

    return community;
}

export async function getTrendingCommunities(limit = 5): Promise<CommunityWithStats[]> {
    // Trending = most posts recently + most subscribers
    const communities = await prisma.community.findMany({
        take: limit,
        orderBy: [
            { subscribers: { _count: 'desc' } },
            { posts: { _count: 'desc' } },
        ],
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    posts: true,
                    subscribers: true,
                },
            },
        },
    });

    return communities;
}

export async function createCommunity(data: {
    name: string;
    slug: string;
    description?: string;
    creatorId: string;
}) {
    const community = await prisma.community.create({
        data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            creatorId: data.creatorId,
        },
    });

    return community;
}

export async function subscribeToCommunity(userId: string, communityId: string) {
    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    if (existing) {
        // Unsubscribe
        await prisma.subscription.delete({
            where: {
                userId_communityId: {
                    userId,
                    communityId,
                },
            },
        });
        return { subscribed: false };
    } else {
        // Subscribe
        await prisma.subscription.create({
            data: {
                userId,
                communityId,
            },
        });
        return { subscribed: true };
    }
}

export async function getUserSubscriptions(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: {
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    return subscriptions.map((s: { community: { id: string; name: string; slug: string } }) => s.community);
}
