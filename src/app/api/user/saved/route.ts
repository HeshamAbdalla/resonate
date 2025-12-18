import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// Get user's saved posts
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const savedPosts = await prisma.savedPost.findMany({
            where: { userId: user.id },
            orderBy: { savedAt: 'desc' },
            include: {
                post: {
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
                },
            },
        });

        const posts = savedPosts.map((sp: typeof savedPosts[number]) => ({
            ...sp.post,
            savedAt: sp.savedAt,
        }));

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        return NextResponse.json({ error: 'Failed to fetch saved posts' }, { status: 500 });
    }
}
