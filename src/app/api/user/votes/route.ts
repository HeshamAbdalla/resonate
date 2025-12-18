import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get user's upvoted/downvoted posts
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'UP'; // 'UP' or 'DOWN'

        const votes = await prisma.postVote.findMany({
            where: {
                userId: user.id,
                type: type as 'UP' | 'DOWN',
            },
            orderBy: { id: 'desc' },
            take: 50,
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                reputation: true,
                            },
                        },
                        community: {
                            select: {
                                slug: true,
                            },
                        },
                        _count: {
                            select: { comments: true },
                        },
                    },
                },
            },
        });

        const posts = votes.map((v: typeof votes[number]) => ({
            ...v.post,
            createdAt: v.post.createdAt.toISOString(),
        }));

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching voted posts:', error);
        return NextResponse.json({ error: 'Failed to fetch voted posts' }, { status: 500 });
    }
}
