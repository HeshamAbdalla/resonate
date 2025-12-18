'use server';

import prisma from '@/lib/db';

export type PostWithDetails = {
    id: string;
    title: string;
    content: string | null;
    type: string;
    url: string | null;
    upvotes: number;
    downvotes: number;
    score: number;
    isPinned: boolean;
    commentsDisabled: boolean;
    createdAt: Date;
    author: {
        id: string;
        username: string;
        reputation: number;
        image: string | null;
    };
    community: {
        id: string;
        name: string;
        slug: string;
        iconImage: string | null;
    };
    _count: {
        comments: number;
    };
};

export async function getPostById(id: string): Promise<PostWithDetails | null> {
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    reputation: true,
                    image: true,
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    iconImage: true,
                },
            },
            _count: {
                select: { comments: true },
            },
        },
    });

    return post;
}
