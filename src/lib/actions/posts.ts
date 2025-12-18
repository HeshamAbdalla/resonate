'use server';

import prisma from '@/lib/db';

export type PostWithRelations = {
    id: string;
    title: string;
    content: string | null;
    type: string;
    url: string | null;
    upvotes: number;
    downvotes: number;
    score: number;
    isPinnedInCommunity?: boolean;
    isLocked?: boolean;
    isNSFW?: boolean;
    createdAt: Date;
    author: {
        id: string;
        username: string;
        image: string | null;
        reputation: number;
    };
    community: {
        id: string;
        name: string;
        slug: string;
    };
    _count: {
        comments: number;
    };
};

export async function getPosts(options?: {
    sort?: 'hot' | 'new' | 'top';
    limit?: number;
    communitySlug?: string;
}): Promise<PostWithRelations[]> {
    const { sort = 'hot', limit = 20, communitySlug } = options || {};

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'top') {
        orderBy = { score: 'desc' };
    } else if (sort === 'hot') {
        // Hot = score weighted by recency
        orderBy = [{ score: 'desc' }, { createdAt: 'desc' }];
    }

    const posts = await prisma.post.findMany({
        where: communitySlug ? { community: { slug: communitySlug } } : undefined,
        orderBy,
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    return posts;
}

export async function getPopularPosts(limit = 20): Promise<PostWithRelations[]> {
    // Popular = highest score posts
    const posts = await prisma.post.findMany({
        orderBy: { score: 'desc' },
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    return posts;
}

export async function getRisingPosts(limit = 20): Promise<(PostWithRelations & { velocity: number })[]> {
    // Rising = posts created recently with high engagement rate
    const recentPosts = await prisma.post.findMany({
        where: {
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // Get more to sort by velocity
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    // Calculate velocity (engagement per hour)
    const postsWithVelocity = recentPosts.map(post => {
        const ageInHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60));
        const velocity = Math.round((post._count.comments + post.score) / ageInHours);
        return { ...post, velocity };
    });

    // Sort by velocity and return top posts
    return postsWithVelocity
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, limit);
}

export async function getPostsByUser(userId: string, limit = 20): Promise<PostWithRelations[]> {
    const posts = await prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    return posts;
}

export async function getPostById(postId: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    image: true,
                    reputation: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            comments: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    return post;
}

export async function createPost(data: {
    title: string;
    content?: string;
    type?: string;
    url?: string;
    communityId: string;
    authorId: string;
}) {
    const post = await prisma.post.create({
        data: {
            title: data.title,
            content: data.content,
            type: data.type || 'text',
            url: data.url,
            communityId: data.communityId,
            authorId: data.authorId,
        },
    });

    return post;
}

export async function voteOnPost(postId: string, userId: string, voteType: 'UP' | 'DOWN') {
    // Check if user already voted
    const existingVote = await prisma.postVote.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    if (existingVote) {
        if (existingVote.type === voteType) {
            // Remove vote (toggle off)
            await prisma.postVote.delete({
                where: { id: existingVote.id },
            });
            // Update post score
            await prisma.post.update({
                where: { id: postId },
                data: {
                    [voteType === 'UP' ? 'upvotes' : 'downvotes']: { decrement: 1 },
                    score: { increment: voteType === 'UP' ? -1 : 1 },
                },
            });
        } else {
            // Change vote
            await prisma.postVote.update({
                where: { id: existingVote.id },
                data: { type: voteType },
            });
            // Update post score (reverse old vote, apply new)
            await prisma.post.update({
                where: { id: postId },
                data: {
                    upvotes: { increment: voteType === 'UP' ? 1 : -1 },
                    downvotes: { increment: voteType === 'DOWN' ? 1 : -1 },
                    score: { increment: voteType === 'UP' ? 2 : -2 },
                },
            });
        }
    } else {
        // New vote
        await prisma.postVote.create({
            data: {
                userId,
                postId,
                type: voteType,
            },
        });
        await prisma.post.update({
            where: { id: postId },
            data: {
                [voteType === 'UP' ? 'upvotes' : 'downvotes']: { increment: 1 },
                score: { increment: voteType === 'UP' ? 1 : -1 },
            },
        });
    }
}
